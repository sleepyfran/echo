import * as S from "@effect/schema/Schema";
import { AuthenticationInfo } from "./authentication";
import { FolderMetadata } from "./file-system";

/**
 * ID of a file-based provider.
 */
export enum FileBasedProviderId {
  OneDrive = "onedrive",
}

/**
 * ID of an API-based provider.
 */
export enum ApiBasedProviderId {
  Spotify = "spotify",
}

/**
 * ID of the provider that the metadata is for.
 */
export const ProviderId = S.Union(
  S.Enums(FileBasedProviderId),
  S.Enums(ApiBasedProviderId),
);
export type ProviderId = S.Schema.Type<typeof ProviderId>;

/**
 * Defines whether the provider connects to the data via a file system (e.g. OneDrive)
 * or via an API (e.g. Spotify).
 */
export enum ProviderType {
  FileBased = "file-based",
  ApiBased = "api-based",
}

/**
 * Metadata of a provider that can identify the provider and the capabilities
 * it supports.
 */
export const ProviderMetadata = S.Struct({
  id: ProviderId,
  type: S.Enums(ProviderType),
});
export type ProviderMetadata = S.Schema.Type<typeof ProviderMetadata>;

/**
 * Metadata of the OneDrive provider.
 */
export const OneDriveProviderMetadata: ProviderMetadata = {
  id: FileBasedProviderId.OneDrive,
  type: ProviderType.FileBased,
};

/**
 * Metadata of the Spotify provider.
 */
export const SpotifyProviderMetadata: ProviderMetadata = {
  id: ApiBasedProviderId.Spotify,
  type: ProviderType.ApiBased,
};

/**
 * List of all the available providers that the application can connect to.
 */
export const AvailableProviders = [
  OneDriveProviderMetadata,
  SpotifyProviderMetadata,
] as const;

/**
 * Enum of possible errors that can occur when interacting with a provider.
 */
export enum ProviderError {
  /**
   * The provided token has expired or is no longer valid.
   */
  TokenExpired = "token-expired",

  /**
   * The provider encountered an error when trying to connect to the API.
   */
  ApiGatewayError = "api-gateway-error",
}

/**
 * Defines all the possible states that a provider can be in.
 */
export type ProviderStatus =
  | { _tag: "not-started" }
  | { _tag: "syncing" }
  | {
      _tag: "synced";
      lastSyncedAt: Date;
      syncedTracks: number;
      tracksWithError: number;
    }
  | { _tag: "errored"; error: ProviderError }
  | { _tag: "stopped" };

/**
 * Defines the parameters required to start a provider, regardless of whether it is
 * file-based or API-based.
 */
const CommonStartArgs = S.Struct({
  lastSyncedAt: S.Option(S.Date),
});

/**
 * Defines the parameters required to start a file-based provider.
 */
export const FileBasedStartArgs = S.extend(
  CommonStartArgs,
  S.TaggedStruct(ProviderType.FileBased, {
    metadata: ProviderMetadata,
    authInfo: AuthenticationInfo,
    rootFolder: FolderMetadata,
  }),
);
export type FileBasedStartArgs = S.Schema.Type<typeof FileBasedStartArgs>;

/**
 * Defines the parameters required to start an API-based provider.
 */
export const ApiBasedStartArgs = S.extend(
  CommonStartArgs,
  S.TaggedStruct(ProviderType.ApiBased, {
    metadata: ProviderMetadata,
    authInfo: AuthenticationInfo,
  }),
);
export type ApiBasedStartArgs = S.Schema.Type<typeof ApiBasedStartArgs>;

/**
 * Defines the parameters required to start a provider, which can be either file-based
 * or API-based.
 */
export const ProviderStartArgs = S.Union(FileBasedStartArgs, ApiBasedStartArgs);
export type ProviderStartArgs = S.Schema.Type<typeof ProviderStartArgs>;
