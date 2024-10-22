import { Data, Effect } from "effect";
import { InitMessage } from "./src/init";

export class WorkerInitializationError extends Data.TaggedError(
  "@echo/workers-image-provider/WorkerInitializationError",
)<{}> {}

/**
 * Creates the ImageProvider worker and initializes it.
 */
export const initializeImageProviderWorker = Effect.sync(() => {
  const worker = new Worker(
    new URL("./src/image-provider.worker", import.meta.url),
    { type: "module" },
  );
  worker.postMessage(InitMessage.make({}));
});
