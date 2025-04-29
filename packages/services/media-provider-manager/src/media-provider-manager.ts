import { Effect, Layer, Option } from "effect";
import {
  ActiveMediaProviderCache,
  AuthenticationCache,
  Broadcaster,
  Database,
  ForceSyncProvider,
  LocalStorage,
  MediaProviderManager,
  ProviderStartArgs,
  StopProvider,
} from "@echo/core-types";

export const MediaProviderManagerLive = Layer.scoped(
  MediaProviderManager,
  Effect.gen(function* () {
    const activeMediaProviderCache = yield* ActiveMediaProviderCache;
    const authenticationCache = yield* AuthenticationCache;
    const broadcaster = yield* Broadcaster;
    const database = yield* Database;
    const localStorage = yield* LocalStorage;

    return MediaProviderManager.of({
      forceSync: (providerId) =>
        Effect.gen(function* () {
          const providerStartArgs = yield* localStorage.get(
            "media-provider-start-args",
            providerId,
            ProviderStartArgs,
          );

          if (Option.isNone(providerStartArgs)) {
            yield* Effect.logWarning(
              `Requested to force sync provider ${providerId}, but there's no information saved about it. Ignoring request...`,
            );
            return;
          }

          // TODO: This indirection of depending on the cache and the start args from the local storage is weird to say the least. Maybe fix me? Caching start args in the active media provider cache without auth info might be a better idea.
          const cachedInfoOrDefault = yield* authenticationCache
            .get(providerId)
            .pipe(
              Effect.map(
                Option.getOrElse(() => providerStartArgs.value.authInfo),
              ),
            );

          yield* Effect.log(
            `Creating request to force ${providerId} to sync...`,
          );

          yield* broadcaster.broadcast(
            "mediaProvider",
            new ForceSyncProvider({
              args: {
                ...providerStartArgs.value,
                authInfo: cachedInfoOrDefault,
              },
            }),
          );
        }),
      signOut: (providerId) =>
        Effect.gen(function* () {
          const providerWithMetadata =
            yield* activeMediaProviderCache.get(providerId);

          if (Option.isNone(providerWithMetadata)) {
            yield* Effect.logWarning(
              `Requested to sign out from provider ${providerId}, but it is not active. Ignoring request...`,
            );
            return;
          }

          const { player, metadata } = providerWithMetadata.value;

          // Stop the syncing engine.
          yield* broadcaster.broadcast(
            "mediaProvider",
            new StopProvider({
              provider: metadata,
            }),
          );

          // Stop the media player.
          yield* player.dispose;

          // Clear authentication info and log-out.
          yield* localStorage.remove("media-provider-start-args", metadata.id);

          // Cleanup albums with this providerId.
          const albumsTable = yield* database.table("albums");
          yield* albumsTable.deleteMany("providerId", providerId);

          // TODO: Cleanup artists with no albums.
        }).pipe(
          // TODO: Maybe propagate the error and show a notification?
          Effect.catchAll((error) =>
            Effect.logError(
              `Failed to sign out from provider ${providerId}: ${error}`,
            ),
          ),
        ),
    });
  }),
);
