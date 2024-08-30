import { Effect } from "effect";
import type {
  ProviderMetadata,
  FolderMetadata,
  AuthenticationError,
} from "../../model";
import type { FileBasedProviderError } from "../media-provider";

/**
 * Empty record used to represent the absence of data, either input or output.
 */
export type Empty = Record<string, never>;

/**
 * Workflow that orchestrates the process of adding a new provider to the application.
 */
export type IAddProviderWorkflow = {
  readonly availableProviders: Effect.Effect<ProviderMetadata[]>;
  readonly loadProvider: (
    metadata: ProviderMetadata,
  ) => Effect.Effect<ProviderMetadata>;
  readonly connectToProvider: () => Effect.Effect<
    FolderMetadata[],
    AuthenticationError | FileBasedProviderError
  >;
  readonly selectRoot: (rootFolder: FolderMetadata) => Effect.Effect<Empty>;
};

/**
 * Tag to identify the operations that can be performed by the AddProviderWorkflow.
 */
export class AddProviderWorkflow extends Effect.Tag(
  "@echo/services-add-provider-fsm/AddProviderWorkflow",
)<AddProviderWorkflow, IAddProviderWorkflow>() {}
