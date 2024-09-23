import { Data, Effect } from "effect";
import { InitMessage } from "./src/init";
import ImageProviderWorker from "./src/image-provider.worker?worker";

export class WorkerInitializationError extends Data.TaggedError(
  "@echo/workers-image-provider/WorkerInitializationError",
)<{}> {}

/**
 * Creates the ImageProvider worker and initializes it.
 */
export const initializeImageProviderWorker = Effect.sync(() => {
  const worker = new ImageProviderWorker();
  worker.postMessage(InitMessage.make({}));
});
