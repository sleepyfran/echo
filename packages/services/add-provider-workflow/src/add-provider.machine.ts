import { Effect, Layer, Request, Schedule } from "effect";
import * as Machine from "@effect/experimental/Machine";
import {
  ActiveMediaProviderCache,
  AddProviderWorkflow,
  LocalStorage,
  MediaProviderMainThreadBroadcastChannel,
  type Authentication,
  type AuthenticationError,
  type AuthenticationInfo,
  type Empty,
  type FileBasedProviderError,
  type FolderMetadata,
  type MediaPlayerFactory,
  type MediaProviderFactory,
  type ProviderMetadata,
} from "@echo/core-types";
import {
  LazyLoadedProvider,
  LazyLoadedMediaPlayer,
} from "@echo/services-bootstrap";

class LoadProvider extends Request.TaggedClass("LoadProvider")<
  Empty,
  never,
  {
    readonly metadata: ProviderMetadata;
  }
> {}

class ConnectToProvider extends Request.TaggedClass("ConnectToProvider")<
  FolderMetadata[], // List of folders on the root of the provider.
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
      providerMetadata: ProviderMetadata;
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
        Requires: Idle state.
        Outputs: WaitingForConnection state with provider and media player factories.
        */
        Machine.procedures.add<LoadProvider>()(
          "LoadProvider",
          ({ state, request }) =>
            Effect.gen(function* () {
              if (state._tag !== "Idle") {
                return [{}, state];
              }

              const providerFactory = yield* providerLazyLoader.load(
                request.metadata,
              );
              const mediaPlayerFactory = yield* mediaPlayerLazyLoader.load(
                request.metadata,
              );

              return [
                {},
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
          ({ state }) =>
            Effect.gen(function* () {
              if (state._tag !== "WaitingForConnection") {
                return [[], state];
              }

              const authInfo =
                yield* state.loadedProvider.authentication.connect;
              const mediaProvider =
                state.loadedProvider.createMediaProvider(authInfo);
              const mediaPlayer =
                yield* state.loadedProvider.createMediaPlayer(authInfo);

              // Cache the provider and the player so that it can be used
              // later on by other services without going through the initialization
              // process again.
              yield* activeMediaProviderCache.add(
                state.loadedProvider.metadata,
                mediaProvider,
                mediaPlayer,
              );

              const rootFolder = yield* mediaProvider.listRoot;

              return [
                rootFolder,
                {
                  _tag: "WaitingForRoot" as const,
                  authInfo,
                  providerMetadata: state.loadedProvider.metadata,
                },
              ];
            }),
        ),

        /*
        Requires: WaitingForRoot state.
        Outputs: Done state, with started media provider in worker thread.
        */
        Machine.procedures.add<SelectRoot>()(
          "SelectRoot",
          ({ state, request }) =>
            Effect.gen(function* () {
              if (state._tag !== "WaitingForRoot") {
                return [{}, state];
              }

              const startArgs = {
                _tag: "file-based" as const,
                metadata: state.providerMetadata,
                authInfo: state.authInfo,
                rootFolder: request.rootFolder,
              };
              yield* broadcastChannel.send("start", startArgs);
              yield* localStorage.set(
                "media-provider-start-args",
                state.providerMetadata.id,
                startArgs,
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
      activeProviders: activeMediaProviderCache.getAll.pipe(
        Effect.map((providers) => providers.map((p) => p.metadata)),
      ),
      loadProvider: (metadata) => actor.send(new LoadProvider({ metadata })),
      connectToProvider: () => actor.send(new ConnectToProvider({})),
      selectRoot: (rootFolder) => actor.send(new SelectRoot({ rootFolder })),
    };
  }),
);
