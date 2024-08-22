import {
  ActiveMediaProviderCache,
  AvailableProviders,
  MediaProviderMainThreadBroadcastChannel,
  type Authentication,
  type AuthenticationInfo,
  type FolderMetadata,
  type MediaPlayer,
  type MediaProvider,
  type ProviderMetadata,
} from "@echo/core-types";
import { LazyLoadedProvider } from "@echo/services-bootstrap";
import { AppLive } from "@echo/services-bootstrap-services";
import { LazyLoadedMediaPlayer } from "@echo/services-bootstrap/src/loaders";
import { Rx } from "@effect-rx/rx";
import { useRx } from "@effect-rx/rx-react";
import { Effect, Match } from "effect";
import { useCallback, useEffect, useMemo } from "react";

const runtime = Rx.runtime(AppLive);
const loadProviderFn = runtime.fn(LazyLoadedProvider.load);
const loadMediaPlayerFn = runtime.fn(
  ({
    metadata,
    authInfo,
  }: {
    metadata: ProviderMetadata;
    authInfo: AuthenticationInfo;
  }) =>
    Effect.gen(function* () {
      const { createMediaPlayer } = yield* LazyLoadedMediaPlayer.load(metadata);
      return yield* createMediaPlayer(authInfo);
    }),
);

export const AddProvider = () => {
  const [loadStatus, loadProvider] = useRx(loadProviderFn);

  const onProviderSelected = useCallback(
    (metadata: ProviderMetadata) => loadProvider(metadata),
    [loadProvider],
  );

  return (
    <div>
      {Match.value(loadStatus).pipe(
        Match.tag("Initial", () => (
          <ProviderSelector onProviderSelected={onProviderSelected} />
        )),
        Match.tag(
          "Success",
          ({ value: { metadata, authentication, createMediaProvider } }) => (
            <ProviderAuthenticator
              metadata={metadata}
              authentication={authentication}
              createMediaProvider={createMediaProvider}
            />
          ),
        ),
        Match.tag("Failure", () => (
          <div style={{ color: "red" }}>Failed to load provider.</div>
        )),
        Match.exhaustive,
      )}
    </div>
  );
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

const authenticateFn = runtime.fn(
  (authentication: Authentication) => authentication.connect,
);

const ProviderAuthenticator = ({
  metadata,
  authentication,
  createMediaProvider,
}: {
  metadata: ProviderMetadata;
  authentication: Authentication;
  createMediaProvider: (authInfo: AuthenticationInfo) => MediaProvider;
}) => {
  const [connectionStatus, connectToProvider] = useRx(authenticateFn);
  const _connectToProvider = () => connectToProvider(authentication);

  return (
    <div>
      {metadata.id}
      {Match.value(connectionStatus).pipe(
        Match.tag("Initial", () => (
          <button onClick={_connectToProvider}>Login</button>
        )),
        Match.tag("Success", ({ value: authInfo }) => (
          <SelectRoot
            authInfo={authInfo}
            metadata={metadata}
            createMediaProvider={createMediaProvider}
          />
        )),
        Match.tag("Failure", (error) => (
          <div>Error: {JSON.stringify(error)}</div>
        )),
        Match.exhaustive,
      )}
    </div>
  );
};

const listRootFn = runtime.fn(
  (mediaProvider: MediaProvider) => mediaProvider.listRoot,
);

const addMediaProviderToCacheFn = runtime.fn(
  ({
    metadata,
    provider,
    player,
  }: {
    metadata: ProviderMetadata;
    provider: MediaProvider;
    player: MediaPlayer;
  }) => ActiveMediaProviderCache.add(metadata, provider, player),
);

const SelectRoot = ({
  authInfo,
  metadata,
  createMediaProvider,
}: {
  authInfo: AuthenticationInfo;
  metadata: ProviderMetadata;
  createMediaProvider: (authInfo: AuthenticationInfo) => MediaProvider;
}) => {
  const [mediaPlayerStatus, createMediaPlayer] = useRx(loadMediaPlayerFn);

  const mediaProvider = useMemo(
    () => createMediaProvider(authInfo),
    [createMediaProvider, authInfo],
  );

  const [listStatus, listRoot] = useRx(listRootFn);
  const [, addMediaProviderToCache] = useRx(addMediaProviderToCacheFn);

  useEffect(() => {
    listRoot(mediaProvider);
    createMediaPlayer({ metadata, authInfo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: Refactor this mess somehow?
  useEffect(() => {
    Match.value(mediaPlayerStatus).pipe(
      Match.tag("Success", ({ value: player }) => {
        addMediaProviderToCache({
          metadata,
          provider: mediaProvider,
          player,
        });
      }),
    );
  }, [mediaPlayerStatus, mediaProvider, metadata, addMediaProviderToCache]);

  return (
    <div>
      {Match.value(listStatus).pipe(
        Match.tag("Initial", () => (
          <div>Loading root of media provider...</div>
        )),
        Match.tag("Success", ({ value: folders }) => (
          <FolderSelector
            authInfo={authInfo}
            metadata={metadata}
            folders={folders}
          />
        )),
        Match.tag("Failure", (error) => (
          <div>Error: {JSON.stringify(error)}</div>
        )),
        Match.exhaustive,
      )}
    </div>
  );
};

const startMediaProviderEffect = (
  authInfo: AuthenticationInfo,
  metadata: ProviderMetadata,
  rootFolder: FolderMetadata,
) =>
  Effect.gen(function* () {
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

    yield* broadcastChannel.send("start", {
      _tag: "file-based",
      metadata,
      authInfo,
      rootFolder,
    });
  });

const startMediaProviderFn = runtime.fn(
  ({
    authInfo,
    metadata,
    rootFolder,
  }: {
    authInfo: AuthenticationInfo;
    metadata: ProviderMetadata;
    rootFolder: FolderMetadata;
  }) => startMediaProviderEffect(authInfo, metadata, rootFolder),
);

const FolderSelector = ({
  authInfo,
  folders,
  metadata,
}: {
  authInfo: AuthenticationInfo;
  folders: FolderMetadata[];
  metadata: ProviderMetadata;
}) => {
  const [selectRootStatus, selectRoot] = useRx(startMediaProviderFn);

  return Match.value(selectRootStatus).pipe(
    Match.tag("Initial", () =>
      folders.map((folder) => (
        <button
          onClick={() => selectRoot({ authInfo, metadata, rootFolder: folder })}
          key={folder.id}
        >
          {folder.name}
        </button>
      )),
    ),
    Match.tag("Success", () => <h1>Done-o! Check the console :^)</h1>),
    Match.tag("Failure", () => (
      <h1 style={{ color: "red" }}>
        Uh, oh! Something went wrong. Check the console :(
      </h1>
    )),
    Match.exhaustive,
  );
};