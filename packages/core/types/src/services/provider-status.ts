import { Context, Effect, Scope, SubscriptionRef } from "effect";
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
  readonly observe: Effect.Effect<
    SubscriptionRef.SubscriptionRef<StateByProvider>
  >;
};

/**
 * Service that listens to the success status of all providers and keeps the
 * status in sync in the local storage.
 */
export type IMediaProviderArgsStorage = {
  /**
   * Listens to the success status of all providers and keeps the status in sync
   * in the local storage.
   */
  readonly keepInSync: Effect.Effect<void, never, Scope.Scope>;
};

/**
 * Tag to identify the MediaProviderStatus service.
 */
export class MediaProviderStatus extends Context.Service<
  MediaProviderStatus,
  IMediaProviderStatus
>()("@echo/core-types/MediaProviderStatus") {}

/**
 * Tag to identify the MediaProviderArgsStorage service.
 */
export class MediaProviderArgsStorage extends Context.Service<
  MediaProviderArgsStorage,
  IMediaProviderArgsStorage
>()("@echo/core-types/MediaProviderArgsStorage") {}
