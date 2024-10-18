import {
  AppInit,
  AvailableProviders,
  LocalStorage,
  MediaPlayerFactory,
  type ILocalStorage,
  type ProviderId,
  ActiveMediaProviderCache,
  type IActiveMediaProviderCache,
  MediaProviderArgsStorage,
  ProviderStartArgs,
  Broadcaster,
  type IBroadcaster,
  StartProvider,
} from "@echo/core-types";
import {
  LazyLoadedMediaPlayer,
  LazyLoadedProvider,
} from "@echo/services-bootstrap";
import type { ILoadedProvider } from "@echo/services-bootstrap/src/loaders/provider";
import { Effect, Layer, Option, Scope } from "effect";
import { initializeWorkers } from "@echo/services-bootstrap-workers";

const make = Effect.gen(function* () {
  const activeMediaProviderCache = yield* ActiveMediaProviderCache;
  const broadcaster = yield* Broadcaster;
  const lazyLoadedProvider = yield* LazyLoadedProvider;
  const lazyLoaderMediaPlayer = yield* LazyLoadedMediaPlayer;
  const localStorage = yield* LocalStorage;
  const mediaProviderArgsStorage = yield* MediaProviderArgsStorage;
  const globalScope = yield* Scope.make();

  yield* Effect.addFinalizer(() => Effect.logError("AppInit finalizer called"));

  return AppInit.of({
    init: Effect.gen(function* () {
      yield* Effect.log(
        "Awaiting worker initialization before starting app...",
      );
      yield* initializeWorkers;
      yield* Effect.log("Worker initialization finished, starting app...");

      yield* mediaProviderArgsStorage.keepInSync.pipe(
        Scope.extend(globalScope),
      );

      const allProviderStates = yield* retrieveAllProviderArgs(localStorage);

      yield* Effect.log(
        `Re-initializing ${allProviderStates.length} providers on startup`,
      );

      yield* Effect.all(
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
              providerFactory,
              mediaPlayerFactory.createMediaPlayer,
              broadcaster,
              activeMediaProviderCache,
            ).pipe(Effect.orElseSucceed(() => {}));
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
  localStorage.get("media-provider-start-args", providerId, ProviderStartArgs);

const reinitializeProvider = (
  startArgs: ProviderStartArgs,
  providerFactory: ILoadedProvider,
  createMediaPlayer: MediaPlayerFactory["createMediaPlayer"],
  broadcaster: IBroadcaster,
  activeMediaProviderCache: IActiveMediaProviderCache,
) =>
  Effect.gen(function* () {
    const authResult = yield* providerFactory.authentication
      .connectSilent(startArgs.authInfo)
      .pipe(
        Effect.tapError((error) =>
          Effect.logWarning(
            `Failed to silently authenticate with ${startArgs.metadata.id}, ignoring cached credentials. Error: ${error}`,
          ),
        ),
      );

    const mediaProvider = providerFactory.createMediaProvider(authResult);
    const mediaPlayer = yield* createMediaPlayer(authResult);

    yield* broadcaster.broadcast(
      "mediaProvider",
      new StartProvider({
        args: {
          ...startArgs,
          authInfo: authResult,
        },
      }),
    );
    yield* activeMediaProviderCache.add(
      startArgs.metadata,
      mediaProvider,
      mediaPlayer,
    );

    yield* Effect.log(
      `Successfully reinitialized ${startArgs.metadata.id} provider`,
    );
  });

export const AppInitLive = Layer.scoped(AppInit, make);
