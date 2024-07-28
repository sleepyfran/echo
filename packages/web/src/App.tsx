import {
  AvailableProviders,
  MediaProviderMainThreadBroadcastChannel,
  type Authentication,
  type AuthenticationInfo,
  type MediaProvider,
  type ProviderMetadata,
  type FolderMetadata,
} from "@echo/core-types";
import { useCallback, useMemo } from "react";
import {
  useEffectCallback,
  useEffectTs,
  useOnMountEffect,
} from "@echo/components-effect-bridge";
import { Effect, Fiber, Match } from "effect";
import { LazyLoadedProvider, MainLive } from "@echo/services-bootstrap";
import { Rx } from "@effect-rx/rx";
import { useRx } from "@effect-rx/rx-react";
import { ProviderStatus } from "@echo/components-provider-status";

const mainRuntime = Rx.runtime(MainLive);
const loadProvider = mainRuntime.fn((metadata: ProviderMetadata) =>
  Effect.gen(function* () {
    const provider = yield* LazyLoadedProvider;
    return yield* provider.load(metadata);
  }),
);
const useProviderLoader = () => useRx(loadProvider);

export const App = () => {
  const [loadStatus, loadProvider] = useProviderLoader();

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
      <ProviderStatus />
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

const ProviderAuthenticator = ({
  metadata,
  authentication,
  createMediaProvider,
}: {
  metadata: ProviderMetadata;
  authentication: Authentication;
  createMediaProvider: (authInfo: AuthenticationInfo) => MediaProvider;
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
  createMediaProvider: (authInfo: AuthenticationInfo) => MediaProvider;
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
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

    // TODO: Move somewhere else.
    const reportStatusFiber = yield* broadcastChannel.registerResolver(
      "reportStatus",
      (status) =>
        Match.value(status.status).pipe(
          Match.tag("not-started", () =>
            Effect.log("Worker reported not being started yet"),
          ),
          Match.tag("syncing", () => Effect.log("Worker is syncing")),
          Match.tag("synced", (data) =>
            Effect.log(
              `Worker has finished syncing ${data.syncedFiles} files. ${data.filesWithError} files had errors and were not synced`,
            ),
          ),
          Match.tag("errored", () => Effect.logError("Worker has errored")),
          Match.tag("stopped", () =>
            Effect.log("Worker has reported not running"),
          ),
          Match.exhaustive,
        ),
    );

    yield* broadcastChannel.send("start", {
      _tag: "file-based",
      metadata,
      authInfo,
      rootFolder,
    });

    // TODO: This should DEFINITELY be somewhere else.
    yield* Fiber.join(reportStatusFiber);
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

// const observeLibrary = Effect.gen(function* () {
//   const library = yield* Library;
//   return yield* library.observeAlbums();
// }).pipe(Effect.provide(MainLive));

// const UserLibrary = () => {
//   const [src, setSrc] = useState<string | undefined>(undefined);
//   const [albumStream, matcher] = useStream(observeLibrary);

//   const playFirstTrack = (tracks: Track[]) => {
//     const track = tracks[0];
//     switch (track.resource.type) {
//       case "file":
//         setSrc(track.resource.uri);
//         break;
//       case "api":
//         break;
//     }
//   };

//   return matcher.pipe(
//     Match.tag("empty", () => <h1>Nothing in your library</h1>),
//     Match.tag("items", ({ items }) => (
//       <div>
//         <audio src={src} autoPlay controls />
//         {items.map(([album, tracks]) => (
//           <div key={album.id}>
//             <h1>{album.name}</h1>
//             <p>{album.artist.name}</p>
//             <button onClick={() => playFirstTrack(tracks)}>Play</button>
//             <hr />
//           </div>
//         ))}
//       </div>
//     )),
//     Match.tag("failure", () => <h1>Failed to load library</h1>),
//     Match.exhaustive,
//   )(albumStream);
// };
