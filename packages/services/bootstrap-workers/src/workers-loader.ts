import { initializeMediaProviderWorker } from "@echo/workers-media-provider";

/**
 * Initializes all startup-workers.
 */
export const initializeWorkers = () => initializeMediaProviderWorker();
