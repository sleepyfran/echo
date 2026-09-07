import { WorkerLive } from "@echo/services-bootstrap";
import { Effect, Ref } from "effect";
import { init } from "./init";
import { WorkerStateRef, type WorkerState } from "./state";

const initialState = Ref.makeUnsafe<WorkerState>({
  stateByProvider: new Map(),
});

/**
 * This worker effect is the main entry-point for the media provider worker and
 * upon initialization, it sets up itself to resolve messages from the main
 * thread.
 */
const worker = Effect.gen(function* () {
  yield* init();
  return yield* Effect.never;
}).pipe(
  Effect.scoped,
  Effect.provide(WorkerLive),
  Effect.provideService(WorkerStateRef, initialState),
);

Effect.runPromise(worker)
  .then(() => {
    console.warn("Media provider worker is done");
  })
  .catch((error) => {
    console.error(
      "Media provider worker has failed, was this expected?",
      error,
    );
  });
