/**
 * ID of the provider that the metadata is for.
 */
export enum ProviderId {
  OneDrive = "onedrive",
  Spotify = "spotify",
}

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
export type ProviderMetadata = {
  id: ProviderId;
  type: ProviderType;
};

/**
 * Metadata of the OneDrive provider.
 */
export const OneDriveProviderMetadata: ProviderMetadata = {
  id: ProviderId.OneDrive,
  type: ProviderType.FileBased,
};

/**
 * Metadata of the Spotify provider.
 */
export const SpotifyProviderMetadata: ProviderMetadata = {
  id: ProviderId.Spotify,
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
      syncedFiles: number;
      filesWithError: number;
    }
  | { _tag: "errored"; error: ProviderError }
  | { _tag: "stopped" };
