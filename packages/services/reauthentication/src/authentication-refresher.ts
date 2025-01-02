import {
  ActiveMediaProviderCache,
  AuthenticationInfo,
  AuthenticationRefresher,
  Broadcaster,
  ProviderAuthInfoChanged,
  ProviderId,
  ProviderMetadata,
  type IActiveMediaProviderCache,
} from "@echo/core-types";
import { Effect, Layer, Option, Schedule } from "effect";
import { isTokenNearingExpiration } from "@echo/core-auth";

/**
 * Implementation of the authentication refresher that polls the active media
 * provider cache every few minutes to check for tokens nearing expirations. If
 * any are found, it will attempt to refresh the token and store it in the
 * authentication cache.
 */
export const AuthenticationRefresherLive = Layer.scoped(
  AuthenticationRefresher,
  Effect.gen(function* () {
    const activeProviderCache = yield* ActiveMediaProviderCache;

    const broadcaster = yield* Broadcaster;

    const onTokenUpdated = (
      providerId: ProviderId,
      authInfo: AuthenticationInfo,
    ) =>
      broadcaster
        .broadcast(
          "authentication",
          new ProviderAuthInfoChanged({
            providerId,
            authInfo,
          }),
        )
        .pipe(
          Effect.catchAll((error) =>
            Effect.logError(
              `Failed to broadcast token update to broadcast channel due to error:\n${error.toString()}`,
            ),
          ),
        );

    return AuthenticationRefresher.of({
      start: Effect.repeat(
        pollAndRefresh(activeProviderCache, onTokenUpdated),
        Schedule.addDelay(Schedule.forever, () => "5 minutes"),
      ),
    });
  }),
);

const pollAndRefresh = (
  activeProviderCache: IActiveMediaProviderCache,
  onTokenUpdated: (
    providerId: ProviderId,
    authInfo: AuthenticationInfo,
  ) => Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    const providers = yield* providersNearingExpiration(activeProviderCache);

    yield* Effect.logInfo(
      `Polled for providers and found ${providers.length} nearing expiration`,
    );

    yield* Effect.all(
      providers.map((provider) =>
        refreshProvider(
          activeProviderCache,
          provider.metadata,
          provider.lastAuthInfo,
          onTokenUpdated,
        ),
      ),
    );
  });

const providersNearingExpiration = (
  activeProviderCache: IActiveMediaProviderCache,
) =>
  activeProviderCache.getAll.pipe(
    Effect.map((providers) =>
      providers.filter(({ lastAuthInfo }) =>
        isTokenNearingExpiration(lastAuthInfo),
      ),
    ),
  );

const refreshProvider = (
  activeProviderCache: IActiveMediaProviderCache,
  metadata: ProviderMetadata,
  currentAuthInfo: AuthenticationInfo,
  onTokenUpdated: (
    providerId: ProviderId,
    authInfo: AuthenticationInfo,
  ) => Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    const provider = yield* activeProviderCache.get(metadata.id);
    if (Option.isNone(provider)) {
      yield* Effect.logWarning(
        `Provider ID ${metadata.id} notified as nearing auth expiration, but provider was not active...`,
      );
      return;
    }

    yield* Effect.logInfo(
      `Attempting to refresh token for provider ${metadata.id} (nearing expiration)`,
    );

    const authentication = provider.value.authentication;
    yield* authentication.connectSilent(currentAuthInfo, true).pipe(
      Effect.tap((authInfo) => onTokenUpdated(metadata.id, authInfo)),
      Effect.tap(() =>
        Effect.logInfo(
          `Token refreshed and stored in cache for provider ${metadata.id}`,
        ),
      ),
      Effect.catchAll(() =>
        Effect.logError(`Failed to refresh token for provider ${metadata.id}`),
      ),
    );
  });
