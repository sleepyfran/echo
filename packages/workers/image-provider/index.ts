import { Data, Effect } from "effect";
import ImageProviderWorker from "./src/image-provider.worker?worker";

export class WorkerInitializationError extends Data.TaggedError(
  "@echo/workers-image-provider/WorkerInitializationError",
)<{}> {}

/**
 * Creates the ImageProvider worker and initializes it.
 */
export const initializeImageProviderWorker = Effect.sync(() => {
  new ImageProviderWorker();
});
