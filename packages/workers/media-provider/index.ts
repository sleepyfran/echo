import type { AppConfig } from "@echo/core-types";
import { InitMessage } from "./src/init";
import MediaProviderWorker from "./src/media-provider.worker?worker";

/**
 * Initializes the media provider worker with the given app config.
 * TODO: Expand documentation of the worker.
 */
export const initializeMediaProviderWorker = (appConfig: AppConfig) => {
  const worker = new MediaProviderWorker();

  worker.postMessage(
    InitMessage.make({
      payload: {
        appConfig,
      },
    }),
  );
};
