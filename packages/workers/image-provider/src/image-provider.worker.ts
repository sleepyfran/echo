import { WorkerLive } from "@echo/services-bootstrap";
import { Effect } from "effect";
import { init } from "./init";

/**
 * This worker effect is the main entry-point for the image provider worker, which
 * loads missing images of artists and albums into the database.
 */
const worker = init().pipe(Effect.provide(WorkerLive));

Effect.runPromise(worker)
  .then(() => {
    console.warn("ImageProvider worker is done");
  })
  .catch((error) => {
    console.error("ImageProvider worker has failed, was this expected?", error);
  });
