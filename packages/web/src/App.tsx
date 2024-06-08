import {
  AvailableProviders,
  type FolderContentMetadata,
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
  useMatcherOf,
  useOnMountEffect,
} from "./effect-bridge-hooks";
import { lazyLoadProviderFromMetadata } from "@echo/infrastructure-bootstrap";
import { BroadcastChannelLive } from "@echo/infrastructure-broadcast-channel";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { AppConfigLive } from "./app-config";
import { Effect, Match } from "effect";

export const App = () => {
  const [addProvider, addProviderStatus, matcher] = useEffectCallback(
    lazyLoadProviderFromMetadata,
  );

  const onProviderSelected = useCallback(
    (metadata: ProviderMetadata) => addProvider(metadata, AppConfigLive),
    [addProvider],
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

  const listState = useOnMountEffect(mediaProvider.listRoot);
  const matcher = useMatcherOf(mediaProvider.listRoot);

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
            foldersOrFiles={state.result}
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
    const broadcastChannel =
      yield* createBroadcastChannel<MainThreadToMediaProviderBroadcastSchema>(
        BroadcastChannelName.MediaProvider,
      );

    yield* broadcastChannel.send("start", {
      _tag: "file-based",
      metadata,
      authInfo,
      rootFolder,
    });
  }).pipe(
    Effect.provide(BroadcastChannelLive),
    Effect.provide(BrowserCryptoLive),
    Effect.scoped,
  ); // TODO: Move to some other layer for the main app.

const FolderSelector = ({
  authInfo,
  foldersOrFiles,
  metadata,
}: {
  authInfo: AuthenticationInfo;
  foldersOrFiles: FolderContentMetadata;
  metadata: ProviderMetadata;
}) => {
  const [selectRoot, selectRootState, matcher] = useEffectCallback(
    startMediaProviderEffect,
  );

  // TODO: Don't tie React onto this! This should be done either on the effect or in a utility function.
  const folders = useMemo(
    () =>
      foldersOrFiles.flatMap((folderOrFile) =>
        Match.value(folderOrFile).pipe(
          Match.tag("folder", (folder) => [folder]),
          Match.tag("file", () => []),
          Match.exhaustive,
        ),
      ),
    [foldersOrFiles],
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
