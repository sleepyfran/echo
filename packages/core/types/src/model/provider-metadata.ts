import * as S from "@effect/schema/Schema";

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
export const ProviderMetadataSchema = S.Struct({
  id: S.Enums(ProviderId),
  type: S.Enums(ProviderType),
});
export type ProviderMetadata = S.Schema.Type<typeof ProviderMetadataSchema>;

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
