import { Effect, Layer, Option, Request, Schedule } from "effect";
import * as Machine from "@effect/experimental/Machine";
import {
  ActiveMediaProviderCache,
  AddProviderWorkflow,
  AvailableProviders,
  LocalStorage,
  MediaProviderMainThreadBroadcastChannel,
  ProviderType,
  type Authentication,
  type AuthenticationError,
  type AuthenticationInfo,
  type Empty,
  type FileBasedProviderError,
  type FolderMetadata,
  type MediaPlayerFactory,
  type MediaProviderFactory,
  type ProviderMetadata,
  type ProviderStartArgs,
  type ProviderWithMetadata,
} from "@echo/core-types";
import {
  LazyLoadedProvider,
  LazyLoadedMediaPlayer,
} from "@echo/services-bootstrap";

class LoadProvider extends Request.TaggedClass("LoadProvider")<
  ProviderMetadata,
  never,
  {
    readonly metadata: ProviderMetadata;
  }
> {}

class ConnectToProvider extends Request.TaggedClass("ConnectToProvider")<
  | {
      requiresRootFolderSelection: true;
      folders: FolderMetadata[];
    }
  | {
      requiresRootFolderSelection: false;
    },
  AuthenticationError | FileBasedProviderError,
  Empty
> {}

class SelectRoot extends Request.TaggedClass("SelectRoot")<
  Empty,
  never,
  {
    readonly rootFolder: FolderMetadata;
  }
> {}

class AddProvider extends Request.TaggedClass("AddProvider")<
  Empty,
  never,
  {
    readonly startArgs: ProviderStartArgs;
    readonly providerWithMetadata: ProviderWithMetadata;
  }
> {}

type MachineState =
  | { _tag: "Idle" }
  | {
      _tag: "WaitingForConnection";
      loadedProvider: {
        metadata: ProviderMetadata;
        authentication: Authentication;
        createMediaProvider: MediaProviderFactory["createMediaProvider"];
        createMediaPlayer: MediaPlayerFactory["createMediaPlayer"];
      };
    }
  | {
      _tag: "WaitingForRoot";
      authInfo: AuthenticationInfo;
      providerWithMetadata: ProviderWithMetadata;
    }
  | { _tag: "Done" };

export const addProviderWorkflow = Machine.makeWith<MachineState>()(
  (_, previousState) =>
    Effect.gen(function* () {
      const state = previousState ?? { _tag: "Idle" };

      const activeMediaProviderCache = yield* ActiveMediaProviderCache;
      const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;
      const providerLazyLoader = yield* LazyLoadedProvider;
      const mediaPlayerLazyLoader = yield* LazyLoadedMediaPlayer;
      const localStorage = yield* LocalStorage;

      return Machine.procedures.make(state).pipe(
        /*
        Private step meant as the last one to add the provider to the worker thread.
        Requires: Nothing.
        Outputs: Done state, with started media provider in worker thread.
        */
        Machine.procedures.addPrivate<AddProvider>()(
          "AddProvider",
          ({ request }) =>
            Effect.gen(function* () {
              yield* broadcastChannel.send("start", request.startArgs);
              yield* localStorage.set(
                "media-provider-start-args",
                request.startArgs.metadata.id,
                request.startArgs,
              );
              yield* activeMediaProviderCache.add(
                request.providerWithMetadata.metadata,
                request.providerWithMetadata.provider,
                request.providerWithMetadata.player,
              );

              return [{}, { _tag: "Done" as const }];
            }),
        ),

        /*
        Requires: Idle state.
        Outputs: WaitingForConnection state with provider and media player factories.
        */
        Machine.procedures.add<LoadProvider>()(
          "LoadProvider",
          ({ state, request }) =>
            Effect.gen(function* () {
              if (state._tag !== "Idle") {
                return [request.metadata, state];
              }

              const providerFactory = yield* providerLazyLoader.load(
                request.metadata,
              );
              const mediaPlayerFactory = yield* mediaPlayerLazyLoader.load(
                request.metadata,
              );

              return [
                request.metadata,
                {
                  _tag: "WaitingForConnection" as const,
                  loadedProvider: {
                    ...providerFactory,
                    ...mediaPlayerFactory,
                  },
                },
              ];
            }),
        ),

        /*
        Requires: WaitingForConnection state.
        Outputs: WaitingForRoot state with provider connected, added to cache
                 and returns root folder.
        */
        Machine.procedures.add<ConnectToProvider>()(
          "ConnectToProvider",
          ({ state, send }) =>
            Effect.gen(function* () {
              if (state._tag !== "WaitingForConnection") {
                return [{ requiresRootFolderSelection: false }, state];
              }

              const authInfo =
                yield* state.loadedProvider.authentication.connect;
              const mediaProvider =
                state.loadedProvider.createMediaProvider(authInfo);
              const mediaPlayer =
                yield* state.loadedProvider.createMediaPlayer(authInfo);

              const providerWithMetadata: ProviderWithMetadata = {
                metadata: state.loadedProvider.metadata,
                provider: mediaProvider,
                player: mediaPlayer,
              };

              if (mediaProvider._tag === ProviderType.FileBased) {
                const rootFolder = yield* mediaProvider.listRoot;

                return [
                  {
                    requiresRootFolderSelection: true,
                    folders: rootFolder,
                  },
                  {
                    _tag: "WaitingForRoot" as const,
                    authInfo,
                    providerWithMetadata,
                  },
                ];
              }

              // For API-based providers, we don't need to select a root folder,
              // so let's start the provider right away.
              const startArgs: ProviderStartArgs = {
                _tag: ProviderType.ApiBased,
                authInfo,
                lastSyncedAt: Option.none(),
                metadata: state.loadedProvider.metadata,
              };

              yield* send(new AddProvider({ startArgs, providerWithMetadata }));

              return [
                { requiresRootFolderSelection: false },
                { _tag: "Done" as const },
              ];
            }),
        ),

        /*
        Requires: WaitingForRoot state.
        Outputs: Done state, with started media provider in worker thread.
        */
        Machine.procedures.add<SelectRoot>()(
          "SelectRoot",
          ({ state, request, send }) =>
            Effect.gen(function* () {
              if (state._tag !== "WaitingForRoot") {
                return [{}, state];
              }

              const startArgs: ProviderStartArgs = {
                _tag: ProviderType.FileBased,
                authInfo: state.authInfo,
                lastSyncedAt: Option.none(),
                metadata: state.providerWithMetadata.metadata,
                rootFolder: request.rootFolder,
              };

              yield* send(
                new AddProvider({
                  startArgs,
                  providerWithMetadata: state.providerWithMetadata,
                }),
              );
              return [{}, { _tag: "Done" as const }];
            }),
        ),
      );
    }),
).pipe(Machine.retry(Schedule.forever));

export const AddProviderWorkflowLive = Layer.scoped(
  AddProviderWorkflow,
  Effect.gen(function* () {
    const actor = yield* Machine.boot(addProviderWorkflow);
    const activeMediaProviderCache = yield* ActiveMediaProviderCache;

    return {
      availableProviders: activeMediaProviderCache.getAll.pipe(
        Effect.map((providers) => providers.map((p) => p.metadata)),
        Effect.map((allActiveProviders) =>
          AvailableProviders.filter(
            (provider) => !allActiveProviders.some((p) => p.id === provider.id),
          ),
        ),
      ),
      loadProvider: (metadata) => actor.send(new LoadProvider({ metadata })),
      connectToProvider: actor.send(new ConnectToProvider({})),
      selectRoot: (rootFolder) => actor.send(new SelectRoot({ rootFolder })),
    };
  }),
);
