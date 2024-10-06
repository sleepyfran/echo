import type {
  ProviderStartArgs,
  ProviderMetadata,
  ProviderStatus,
} from "../model";

/**
 * Defines the schema for messages flowing from the main thread to the media
 * provider worker.
 */
type MainThreadActionsSchema = {
  /**
   * Starts the media provider with the given name authenticating the underlying
   * APIs with the given authentication information that was previously obtained
   * by the provider's auth process.
   */
  start: ProviderStartArgs;

  /**
   * Stops the media provider with the given name, if it is currently running.
   * Otherwise, this action has no effect.
   */
  stop: { provider: ProviderMetadata };
};

/**
 * Defines the schema for messages flowing from the media provider worker to the
 * main thread.
 */
type WorkerActionsSchema = {
  /**
   * Reports the status of a provider to the main thread.
   */
  reportStatus: {
    startArgs: ProviderStartArgs;
    status: ProviderStatus;
  };
};

/**
 * Defines the schema for the media provider broadcast channel.
 */
export type MediaProviderBroadcastSchema = {
  mainThread: {
    actions: MainThreadActionsSchema;
    resolvers: WorkerActionsSchema;
  };
  worker: {
    actions: WorkerActionsSchema;
    resolvers: MainThreadActionsSchema;
  };
};
