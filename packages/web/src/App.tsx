import {
  AvailableProviders,
  type Authentication,
  type AuthenticationInfo,
  type Provider,
  type ProviderMetadata,
  type FolderMetadata,
  BroadcastChannelFactory,
  BroadcastChannelName,
  type MainThreadToMediaProviderBroadcastSchema,
} from "@echo/core-types";
import { useCallback, useMemo } from "react";
import {
  useEffectCallback,
  useEffectTs,
  useOnMountEffect,
} from "./effect-bridge-hooks";
import { Effect, Match } from "effect";
import { LazyLoadedProvider, MainLive } from "@echo/infrastructure-bootstrap";

const retrieveLazyLoader = Effect.gen(function* () {
  return yield* LazyLoadedProvider;
}).pipe(Effect.provide(MainLive));

export const App = () => {
  const [state, matcher] = useOnMountEffect(retrieveLazyLoader);

  return matcher.pipe(
    Match.tag("initial", () => <h1>Initializing Echo...</h1>),
    Match.tag("success", ({ result: lazyLoader }) => (
      <MainScreen lazyLoader={lazyLoader} />
    )),
    Match.tag("failure", () => (
      <h1 style={{ color: "red" }}>
        Something went wrong initializing echo... Maybe report a bug :)
      </h1>
    )),
    Match.exhaustive,
  )(state);
};

const MainScreen = ({ lazyLoader }: { lazyLoader: LazyLoadedProvider }) => {
  const [loadProvider, addProviderStatus, matcher] = useEffectCallback(
    lazyLoader.load,
  );

  const onProviderSelected = useCallback(
    (metadata: ProviderMetadata) => loadProvider(metadata),
    [loadProvider],
  );

  return matcher.pipe(
    Match.tag("initial", () => (
      <ProviderSelector onProviderSelected={onProviderSelected} />
    )),
    Match.tag("success", ({ result }) => (
      <ProviderAuthenticator
        metadata={result.metadata}
        authentication={result.authentication}
        createMediaProvider={result.createMediaProvider}
      />
    )),
    Match.tag("failure", () => (
      <div style={{ color: "red" }}>Failed to load provider.</div>
    )),
    Match.exhaustive,
  )(addProviderStatus);
};

const ProviderSelector = ({
  onProviderSelected,
}: {
  onProviderSelected: (metadata: ProviderMetadata) => void;
}) =>
  AvailableProviders.map((metadata) => (
    <button key={metadata.id} onClick={() => onProviderSelected(metadata)}>
      {metadata.id}
    </button>
  ));

const ProviderAuthenticator = ({
  metadata,
  authentication,
  createMediaProvider,
}: {
  metadata: ProviderMetadata;
  authentication: Authentication;
  createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
}) => {
  const [connectToProvider, connectState, matcher] = useEffectTs(
    authentication.connect,
  );

  return (
    <div>
      {metadata.id}
      {matcher.pipe(
        Match.tag("initial", () => (
          <button onClick={connectToProvider}>Login</button>
        )),
        Match.tag("success", (state) => (
          <SelectRoot
            authInfo={state.result}
            metadata={metadata}
            createMediaProvider={createMediaProvider}
          />
        )),
        Match.tag("failure", (state) => <div>Error: {state.error}</div>),
        Match.exhaustive,
      )(connectState)}
    </div>
  );
};

const SelectRoot = ({
  authInfo,
  metadata,
  createMediaProvider,
}: {
  authInfo: AuthenticationInfo;
  metadata: ProviderMetadata;
  createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
}) => {
  const mediaProvider = useMemo(
    () => createMediaProvider(authInfo),
    [createMediaProvider, authInfo],
  );

  const [listState, matcher] = useOnMountEffect(mediaProvider.listRoot);

  return (
    <div>
      {matcher.pipe(
        Match.tag("initial", () => (
          <div>Loading root of media provider...</div>
        )),
        Match.tag("success", (state) => (
          <FolderSelector
            authInfo={authInfo}
            metadata={metadata}
            folders={state.result}
          />
        )),
        Match.tag("failure", (state) => <div>Error: {state.error}</div>),
        Match.exhaustive,
      )(listState)}
    </div>
  );
};

const startMediaProviderEffect = (
  authInfo: AuthenticationInfo,
  metadata: ProviderMetadata,
  rootFolder: FolderMetadata,
) =>
  Effect.gen(function* () {
    const { create: createBroadcastChannel } = yield* BroadcastChannelFactory;
    const toWorkerBroadcastChannel =
      yield* createBroadcastChannel<MainThreadToMediaProviderBroadcastSchema>(
        BroadcastChannelName.MediaProvider,
      );

    yield* toWorkerBroadcastChannel.send("start", {
      _tag: "file-based",
      metadata,
      authInfo,
      rootFolder,
    });
  }).pipe(Effect.provide(MainLive));

const FolderSelector = ({
  authInfo,
  folders,
  metadata,
}: {
  authInfo: AuthenticationInfo;
  folders: FolderMetadata[];
  metadata: ProviderMetadata;
}) => {
  const [selectRoot, selectRootState, matcher] = useEffectCallback(
    startMediaProviderEffect,
  );

  return matcher.pipe(
    Match.tag("initial", () =>
      folders.map((folder) => (
        <button
          onClick={() => selectRoot(authInfo, metadata, folder)}
          key={folder.id}
        >
          {folder.name}
        </button>
      )),
    ),
    Match.tag("success", () => <h1>Done-o! Check the console :^)</h1>),
    Match.tag("failure", () => (
      <h1 style={{ color: "red" }}>
        Uh, oh! Something went wrong. Check the console :(
      </h1>
    )),
    Match.exhaustive,
  )(selectRootState);
};
