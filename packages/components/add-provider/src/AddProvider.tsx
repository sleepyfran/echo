import {
  AddProviderWorkflow,
  AvailableProviders,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { AddProviderWorkflowLive } from "@echo/services-add-provider-workflow";
import { AppLive } from "@echo/services-bootstrap-services";
import { Rx } from "@effect-rx/rx";
import { useRx } from "@effect-rx/rx-react";
import { Layer, Match } from "effect";
import { useCallback } from "react";

const runtime = Rx.runtime(
  AddProviderWorkflowLive.pipe(Layer.provide(AppLive)),
);
const loadProviderFn = runtime.fn(AddProviderWorkflow.loadProvider);
const connectToProviderFn = runtime.fn(AddProviderWorkflow.connectToProvider);
const selectRootFn = runtime.fn(AddProviderWorkflow.selectRoot);

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
        Match.tag("Success", () => <ProviderAuthenticator />),
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

const ProviderAuthenticator = () => {
  const [connectionStatus, connectToProvider] = useRx(connectToProviderFn);
  const _connectToProvider = () => connectToProvider();

  return (
    <div>
      {Match.value(connectionStatus).pipe(
        Match.tag("Initial", () => (
          <button onClick={_connectToProvider}>Login</button>
        )),
        Match.tag("Success", ({ value: rootFolderContent }) => (
          <SelectRoot rootFolderContent={rootFolderContent} />
        )),
        Match.tag("Failure", (error) => (
          <div>Error: {JSON.stringify(error)}</div>
        )),
        Match.exhaustive,
      )}
    </div>
  );
};

const SelectRoot = ({
  rootFolderContent: folders,
}: {
  rootFolderContent: FolderMetadata[];
}) => {
  const [selectRootStatus, selectRoot] = useRx(selectRootFn);

  return Match.value(selectRootStatus).pipe(
    Match.tag("Initial", () =>
      folders.map((folder) => (
        <button onClick={() => selectRoot(folder)} key={folder.id}>
          {folder.name}
        </button>
      )),
    ),
    Match.tag("Success", () => <h1>Done!</h1>),
    Match.tag("Failure", () => (
      <h1 style={{ color: "red" }}>
        Uh, oh! Something went wrong. Check the console :(
      </h1>
    )),
    Match.exhaustive,
  );
};
