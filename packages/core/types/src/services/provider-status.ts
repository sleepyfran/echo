import { Effect, SubscriptionRef } from "effect";
import type { ProviderId, ProviderStatus } from "../model";

/**
 * Defines the state of all currently active providers.
 */
export type StateByProvider = Map<ProviderId, ProviderStatus>;

/**
 * Service that listen to the status of all providers and allows to observe
 * changes to them.
 */
export type IMediaProviderStatus = {
  /**
   * Returns a subscription ref that holds the current status of a specific
   * provider, while also allowing to observe changes to it.
   */
  readonly observe: SubscriptionRef.SubscriptionRef<StateByProvider>;
};

/**
 * Tag to identify the MediaProviderStatus service.
 */
export class MediaProviderStatus extends Effect.Tag(
  "@echo/core-types/MediaProviderStatus",
)<MediaProviderStatus, IMediaProviderStatus>() {}
