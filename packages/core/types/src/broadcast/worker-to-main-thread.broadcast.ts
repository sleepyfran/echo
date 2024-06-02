import type { ProviderMetadata } from "../model";

/**
 * Defines the schema for messages flowing from the media provider worker to the
 * main thread.
 */
export type MediaProviderWorkerToMainThreadBroadcastSchema = {
  /**
   * Signal raised by the media provider when the token has either expired
   * or is no longer valid. Upon receiving this signal, the main thread
   * should acquire a new token from the provider and re-start the provider
   * with the new token.
   */
  stoppedDueToExpiredToken: {
    metadata: ProviderMetadata;
  };
};
