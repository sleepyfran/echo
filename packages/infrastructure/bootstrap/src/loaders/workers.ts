import { initializeMediaProviderWorker } from "@echo/workers-media-provider";

/**
 * Initializes all startup-workers with the given configuration.
 */
export const initializeWorkers = () => initializeMediaProviderWorker();
