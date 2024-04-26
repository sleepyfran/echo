import {
  AvailableProviders,
  type FolderContent,
  ProviderFactory,
  ProviderType,
  type Authentication,
  type AuthenticationInfo,
  type Provider,
  type ProviderMetadata,
} from "@echo/core-types";
import { providerFactoryByMetadata } from "./provider-loader";
import { Effect, Layer } from "effect";
import { useState, useCallback, useMemo, useEffect } from "react";
import { AppConfigLive } from "./app-config";
import { useEffectTs } from "./effect-bridge-hooks";

type Status =
  | { state: "none-selected" }
  | {
      state: "selected";
      metadata: ProviderMetadata;
      authentication: Authentication;
      createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
    };

const loadProviderByMetadata = (metadata: ProviderMetadata) =>
  Effect.gen(function* () {
    const providerFactoryLive = providerFactoryByMetadata(metadata).pipe(
      Layer.provide(AppConfigLive),
    );

    return yield* Effect.provide(
      Effect.gen(function* () {
        const providerFactory = yield* ProviderFactory;
        const authentication = yield* providerFactory.authenticationProvider;

        return {
          metadata,
          authentication,
          createMediaProvider: providerFactory.createMediaProvider,
        };
      }),
      providerFactoryLive,
    );
  });

export const App = () => {
  const [status, setStatus] = useState<Status>({
    state: "none-selected",
  });

  const addProvider = useCallback((metadata: ProviderMetadata) => {
    Effect.runPromise(loadProviderByMetadata(metadata)).then((result) =>
      setStatus({ state: "selected", ...result }),
    );
  }, []);

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

  return (
    <div>
      {metadata.id}
      {connectState.state === "initial" && (
        <button onClick={connectToProvider}>Login</button>
      )}
      {connectState.state === "success" &&
        metadata.type === ProviderType.FileBased && (
          <SelectRoot
            authInfo={connectState.result}
            createMediaProvider={createMediaProvider}
          />
        )}
      {connectState.state === "failure" && (
        <div>Error: {connectState.error}</div>
      )}
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

  const [listRoot, listState] = useEffectTs(mediaProvider.listRoot);

  useEffect(() => listRoot(), [listRoot]);

  return (
    <div>
      {listState.state === "initial" && (
        <div>Loading root of media provider...</div>
      )}
      {listState.state === "success" && (
        <FolderSelector foldersOrFiles={listState.result} />
      )}
      {listState.state === "failure" && <div>Error: {listState.error}</div>}
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
