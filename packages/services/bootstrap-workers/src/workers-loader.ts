import { initializeMediaProviderWorker } from "@echo/workers-media-provider";
import { initializeImageProviderWorker } from "@echo/workers-image-provider";
import { Effect } from "effect";

/**
 * Initializes all startup-workers.
 */
export const initializeWorkers = Effect.all([
  initializeMediaProviderWorker,
  initializeImageProviderWorker,
]);
