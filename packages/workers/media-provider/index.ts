import type { AppConfig } from "@echo/core-types";
import { InitMessage } from "./src/init";

/**
 * Initializes the media provider worker with the given app config.
 * TODO: Expand documentation of the worker.
 */
export const initializeMediaProviderWorker = (appConfig: AppConfig) => {
  const worker = new Worker(
    new URL("./media-provider.worker.ts", import.meta.url),
    { type: "module" },
  );

  worker.postMessage(
    InitMessage.make({
      payload: {
        appConfig,
      },
    }),
  );
};
