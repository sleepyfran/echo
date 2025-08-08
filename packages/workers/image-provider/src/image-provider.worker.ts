import { WorkerLive } from "@echo/services-bootstrap";
import { Effect, Match, Stream } from "effect";
import * as S from "effect/Schema";
import { InitMessage, init } from "./init";

export const WorkerMessage = S.Union(InitMessage);
type WorkerMessage = S.Schema.Type<typeof WorkerMessage>;

const decodeWorkerMessage = S.decode(WorkerMessage);

/**
 * This worker effect is the main entry-point for the image provider worker, which
 * loads missing images of artists and albums into the database.
 */
const worker = Stream.fromEventListener<MessageEvent>(self, "message").pipe(
  Stream.runForEach((event) =>
    Effect.gen(function* () {
      const message = yield* decodeWorkerMessage(event.data);

      return yield* Match.type<WorkerMessage>().pipe(
        Match.tag("init", () => init()),
        Match.exhaustive,
      )(message);
    }),
  ),
  Effect.provide(WorkerLive),
);

Effect.runPromise(worker)
  .then(() => {
    console.warn("ImageProvider worker is done");
  })
  .catch((error) => {
    console.error("ImageProvider worker has failed, was this expected?", error);
  });
