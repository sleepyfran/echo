import { Effect, Layer, Option } from "effect";
import {
  ActiveMediaProviderCache,
  AddProviderWorkflow,
  AvailableProviders,
  Broadcaster,
  LocalStorage,
  ProviderMetadata,
  ProviderStartArgs,
  ProviderType,
  StartProvider,
  type DoneState,
  type IActiveMediaProviderCache,
  type IAddProviderWorkflow,
  type IBroadcaster,
  type ILocalStorage,
  type ProviderWithMetadata,
  type RequiresRootSelectionState,
  type WaitingForConnectionState,
} from "@echo/core-types";
import {
  LazyLoadedProvider,
  LazyLoadedMediaPlayer,
  type ILazyLoadedMediaPlayer,
  type ILazyLoadedProvider,
} from "@echo/services-bootstrap";

const createAvailableProviders = (
  activeMediaProviderCache: IActiveMediaProviderCache,
) =>
  activeMediaProviderCache.getAll.pipe(
    Effect.map((providers) => providers.map((p) => p.metadata)),
    Effect.map((allActiveProviders) =>
      AvailableProviders.filter(
        (provider) => !allActiveProviders.some((p) => p.id === provider.id),
      ),
    ),
  );

const createLoadProvider =
  (
    providerLazyLoader: ILazyLoadedProvider,
    mediaPlayerLazyLoader: ILazyLoadedMediaPlayer,
  ) =>
  (metadata: ProviderMetadata): Effect.Effect<WaitingForConnectionState> =>
    Effect.gen(function* () {
      const providerFactory = yield* providerLazyLoader.load(metadata);
      const mediaPlayerFactory = yield* mediaPlayerLazyLoader.load(metadata);

      return {
        _tag: "WaitingForConnection",
        loadedProvider: {
          ...providerFactory,
          ...mediaPlayerFactory,
        },
      };
    });

const addProvider = (
  activeMediaProviderCache: IActiveMediaProviderCache,
  broadcaster: IBroadcaster,
  localStorage: ILocalStorage,
  providerWithMetadata: ProviderWithMetadata,
  startArgs: ProviderStartArgs,
) =>
  Effect.gen(function* () {
    yield* broadcaster
      .broadcast(
        "mediaProvider",
        new StartProvider({
          args: startArgs,
        }),
      )
      .pipe(Effect.orDie);

    yield* localStorage.set(
      "media-provider-start-args",
      startArgs.metadata.id,
      ProviderStartArgs,
      startArgs,
    );
    yield* activeMediaProviderCache.add(providerWithMetadata);
  });

const createConnectToProvider =
  (
    activeMediaProviderCache: IActiveMediaProviderCache,
    broadcaster: IBroadcaster,
    localStorage: ILocalStorage,
  ): IAddProviderWorkflow["connectToProvider"] =>
  (state) =>
    Effect.gen(function* () {
      const authInfo = yield* state.loadedProvider.authentication.connect;
      const mediaProvider = state.loadedProvider.createMediaProvider(authInfo);
      const mediaPlayer =
        yield* state.loadedProvider.createMediaPlayer(authInfo);

      const providerWithMetadata: ProviderWithMetadata = {
        lastAuthInfo: authInfo,
        metadata: state.loadedProvider.metadata,
        authentication: state.loadedProvider.authentication,
        provider: mediaProvider,
        player: mediaPlayer,
      };

      if (mediaProvider._tag === ProviderType.FileBased) {
        const rootFolder = yield* mediaProvider.listRoot;

        return {
          _tag: "WaitingForRoot",
          authInfo,
          providerWithMetadata,
          rootFolders: rootFolder,
        } satisfies RequiresRootSelectionState;
      }

      // For API-based providers, we don't need to select a root folder,
      // so let's start the provider right away.
      const startArgs: ProviderStartArgs = {
        _tag: ProviderType.ApiBased,
        authInfo,
        lastSyncedAt: Option.none(),
        metadata: state.loadedProvider.metadata,
      };

      yield* addProvider(
        activeMediaProviderCache,
        broadcaster,
        localStorage,
        providerWithMetadata,
        startArgs,
      );

      return {
        _tag: "Done",
        providerWithMetadata,
      } satisfies DoneState;
    });

const createSelectRoot =
  (
    activeMediaProviderCache: IActiveMediaProviderCache,
    broadcaster: IBroadcaster,
    localStorage: ILocalStorage,
  ): IAddProviderWorkflow["selectRoot"] =>
  (state, rootFolder) =>
    Effect.gen(function* () {
      const startArgs: ProviderStartArgs = {
        _tag: ProviderType.FileBased,
        authInfo: state.authInfo,
        lastSyncedAt: Option.none(),
        metadata: state.providerWithMetadata.metadata,
        rootFolder: rootFolder,
      };

      yield* addProvider(
        activeMediaProviderCache,
        broadcaster,
        localStorage,
        state.providerWithMetadata,
        startArgs,
      );

      return {
        _tag: "Done",
        providerWithMetadata: state.providerWithMetadata,
      } satisfies DoneState;
    });

export const AddProviderWorkflowLive = Layer.scoped(
  AddProviderWorkflow,
  Effect.gen(function* () {
    const activeMediaProviderCache = yield* ActiveMediaProviderCache;
    const broadcaster = yield* Broadcaster;
    const providerLazyLoader = yield* LazyLoadedProvider;
    const mediaPlayerLazyLoader = yield* LazyLoadedMediaPlayer;
    const localStorage = yield* LocalStorage;

    return {
      availableProviders: createAvailableProviders(activeMediaProviderCache),
      loadProvider: createLoadProvider(
        providerLazyLoader,
        mediaPlayerLazyLoader,
      ),
      connectToProvider: createConnectToProvider(
        activeMediaProviderCache,
        broadcaster,
        localStorage,
      ),
      selectRoot: createSelectRoot(
        activeMediaProviderCache,
        broadcaster,
        localStorage,
      ),
    };
  }),
);
