import type { ProviderMetadata, ProviderStatus } from "../model";

/**
 * Defines the schema for messages flowing from the media provider worker to the
 * main thread.
 */
export type MediaProviderWorkerToMainThreadBroadcastSchema = {
  /**
   * Reports the status of a provider to the main thread.
   */
  reportStatus: {
    metadata: ProviderMetadata;
    status: ProviderStatus;
  };
};
