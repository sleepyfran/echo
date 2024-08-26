import { isValidToken } from "@echo/core-auth";
import {
  AppInit,
  AvailableProviders,
  LocalStorage,
  MediaPlayerFactory,
  MediaProviderFactory,
  MediaProviderMainThreadBroadcastChannel,
  type ProviderStartArgs,
  type BroadcastChannel,
  type ILocalStorage,
  type MediaProviderBroadcastSchema,
  type ProviderId,
  ActiveMediaProviderCache,
  type IActiveMediaProviderCache,
} from "@echo/core-types";
import {
  LazyLoadedMediaPlayer,
  LazyLoadedProvider,
} from "@echo/services-bootstrap";
import { Effect, Layer, Option } from "effect";

const make = Effect.gen(function* () {
  const activeMediaProviderCache = yield* ActiveMediaProviderCache;
  const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;
  const lazyLoadedProvider = yield* LazyLoadedProvider;
  const lazyLoaderMediaPlayer = yield* LazyLoadedMediaPlayer;
  const localStorage = yield* LocalStorage;

  return AppInit.of({
    init: Effect.gen(function* () {
      const allProviderStates = yield* retrieveAllProviderArgs(localStorage);

      return yield* Effect.all(
        allProviderStates.map((providerStartArgs) =>
          Effect.gen(function* () {
            const retrievedMetadata = {
              id: providerStartArgs.value.metadata.id,
              type: providerStartArgs.value.metadata.type,
            };

            const providerFactory =
              yield* lazyLoadedProvider.load(retrievedMetadata);
            const mediaPlayerFactory =
              yield* lazyLoaderMediaPlayer.load(retrievedMetadata);

            return yield* reinitializeProvider(
              providerStartArgs.value,
              providerFactory.createMediaProvider,
              mediaPlayerFactory.createMediaPlayer,
              broadcastChannel,
              activeMediaProviderCache,
            );
          }),
        ),
      );
    }),
  });
});

const retrieveAllProviderArgs = (localStorage: ILocalStorage) =>
  Effect.gen(function* () {
    const allProviders = yield* Effect.all(
      AvailableProviders.map((provider) =>
        retrieveProviderArgs(provider.id, localStorage),
      ),
    );
    return allProviders.filter(Option.isSome);
  });

const retrieveProviderArgs = (
  providerId: ProviderId,
  localStorage: ILocalStorage,
) =>
  localStorage.get<ProviderStartArgs>("media-provider-start-args", providerId);

const reinitializeProvider = (
  startArgs: ProviderStartArgs,
  createMediaProvider: MediaProviderFactory["createMediaProvider"],
  createMediaPlayer: MediaPlayerFactory["createMediaPlayer"],
  broadcastChannel: BroadcastChannel<
    MediaProviderBroadcastSchema["mainThread"]
  >,
  activeMediaProviderCache: IActiveMediaProviderCache,
) =>
  Effect.gen(function* () {
    // TODO: This should attempt to refresh the token if it's expired.
    // TODO: Instead of ignoring the initialization with a warning, we should notify the user.
    if (!isValidToken(startArgs.authInfo)) {
      yield* Effect.logWarning(
        `The retrieved token for ${startArgs.metadata.id} is invalid, ignoring initialization.`,
      );
    }

    const mediaProvider = createMediaProvider(startArgs.authInfo);
    const mediaPlayer = yield* createMediaPlayer(startArgs.authInfo);

    yield* broadcastChannel.send("start", startArgs);
    yield* activeMediaProviderCache.add(
      startArgs.metadata,
      mediaProvider,
      mediaPlayer,
    );
  });

export const AppInitLive = Layer.effect(AppInit, make);
