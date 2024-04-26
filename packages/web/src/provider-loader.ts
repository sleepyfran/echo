import {
  ProviderId,
  type AppConfig,
  ProviderFactory,
  type ProviderMetadata,
} from "@echo/core-types";
import { OneDriveProviderFactoryLive } from "@echo/infrastructure-onedrive-provider";
import { Layer } from "effect";

/**
 * Lazy loads a media provider based on the metadata provided.
 * TODO: Move to a shared package so that we don't need to duplicate this logic.
 */
export const providerFactoryByMetadata = (
  metadata: ProviderMetadata,
): Layer.Layer<ProviderFactory, never, AppConfig> => {
  if (metadata.id === ProviderId.OneDrive) {
    return OneDriveProviderFactoryLive;
  }

  throw new Error(
    `No package available for provider with name: ${metadata.id}`,
  );
};
