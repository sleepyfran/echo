import { Effect } from "effect";
import type {
  ProviderMetadata,
  FolderMetadata,
  AuthenticationError,
  AuthenticationInfo,
} from "../../model";
import type {
  FileBasedProviderError,
  MediaPlayerFactory,
  MediaProviderFactory,
} from "../media-provider";
import type { Authentication } from "../authentication";
import type { ProviderWithMetadata } from "../active-media-provider-cache";

export type WaitingForConnectionState = {
  _tag: "WaitingForConnection";
  loadedProvider: {
    metadata: ProviderMetadata;
    authentication: Authentication;
    createMediaProvider: MediaProviderFactory["createMediaProvider"];
    createMediaPlayer: MediaPlayerFactory["createMediaPlayer"];
  };
};

export type RequiresRootSelectionState = {
  _tag: "WaitingForRoot";
  authInfo: AuthenticationInfo;
  rootFolders: FolderMetadata[];
  providerWithMetadata: ProviderWithMetadata;
};

export type DoneState = {
  _tag: "Done";
  providerWithMetadata: ProviderWithMetadata;
};

/**
 * Workflow that orchestrates the process of adding a new provider to the application.
 */
export type IAddProviderWorkflow = {
  readonly availableProviders: Effect.Effect<ProviderMetadata[]>;
  readonly loadProvider: (
    metadata: ProviderMetadata,
  ) => Effect.Effect<WaitingForConnectionState>;
  readonly connectToProvider: (
    state: WaitingForConnectionState,
  ) => Effect.Effect<
    RequiresRootSelectionState | DoneState,
    AuthenticationError | FileBasedProviderError
  >;
  readonly selectRoot: (
    state: RequiresRootSelectionState,
    rootFolder: FolderMetadata,
  ) => Effect.Effect<DoneState>;
};

/**
 * Tag to identify the operations that can be performed by the AddProviderWorkflow.
 */
export class AddProviderWorkflow extends Effect.Tag(
  "@echo/services-add-provider-fsm/AddProviderWorkflow",
)<AddProviderWorkflow, IAddProviderWorkflow>() {}
