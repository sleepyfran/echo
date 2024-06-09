import { initializeMediaProviderWorker } from "@echo/workers-media-provider";
import type { AppConfig } from "@echo/core-types";

/**
 * Initializes all startup-workers with the given configuration.
 */
export const initializeWorkers = (appConfig: AppConfig) =>
  initializeMediaProviderWorker(appConfig);
