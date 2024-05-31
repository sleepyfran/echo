import {
  AvailableProviders,
  type FolderContent,
  type Authentication,
  type AuthenticationInfo,
  type Provider,
  type ProviderMetadata,
} from "@echo/core-types";
import { useState, useCallback, useMemo } from "react";
import {
  createResultMatcher,
  useEffectRunner,
  useEffectTs,
  useMatcherOf,
  useOnMountEffect,
} from "./effect-bridge-hooks";
import { lazyLoadProviderFromMetadata } from "@echo/infrastructure-bootstrap";
import { AppConfigLive } from "./app-config";
import { Match } from "effect";

type Status =
  | { state: "none-selected" }
  | {
      state: "selected";
      metadata: ProviderMetadata;
      authentication: Authentication;
      createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
    };

export const App = () => {
  const [status, setStatus] = useState<Status>({
    state: "none-selected",
  });
  const runEffect = useEffectRunner();

  const addProvider = useCallback(
    (metadata: ProviderMetadata) => {
      const effect = lazyLoadProviderFromMetadata(metadata, AppConfigLive);
      const matcher = createResultMatcher(effect);

      runEffect(effect).then(
        matcher.pipe(
          Match.tag("initial", () => {}),
          Match.tag("success", (state) =>
            setStatus({
              state: "selected",
              metadata,
              authentication: state.result.authentication,
              createMediaProvider: state.result.createMediaProvider,
            }),
          ),
          Match.tag("failure", () => setStatus({ state: "none-selected" })),
          Match.exhaustive,
        ),
      );
    },
    [runEffect],
  );

  return status.state === "none-selected" ? (
    <ProviderSelector onProviderSelected={addProvider} />
  ) : (
    <ProviderAuthenticator {...status} />
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
  createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
}) => {
  const [connectToProvider, connectState] = useEffectTs(authentication.connect);
  const matcher = useMatcherOf(authentication.connect);

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
  createMediaProvider,
}: {
  authInfo: AuthenticationInfo;
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
          <FolderSelector foldersOrFiles={state.result} />
        )),
        Match.tag("failure", (state) => <div>Error: {state.error}</div>),
        Match.exhaustive,
      )(listState)}
    </div>
  );
};

const FolderSelector = ({
  foldersOrFiles,
}: {
  foldersOrFiles: FolderContent;
}) => {
  return foldersOrFiles.map((folderOrFile) => (
    <button key={folderOrFile.id}>{folderOrFile.name}</button>
  ));
};
