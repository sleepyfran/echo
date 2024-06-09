import { WorkerLive } from "@echo/infrastructure-bootstrap";
import { Effect, Match, Ref, Stream } from "effect";
import * as S from "@effect/schema/Schema";
import { InitMessage, init } from "./init";
import { WorkerStateRef, type WorkerState } from "./state";

export const WorkerMessage = S.Union(InitMessage);
type WorkerMessage = S.Schema.Type<typeof WorkerMessage>;

const decodeWorkerMessage = S.decode(WorkerMessage);

const initialState = Ref.make<WorkerState>({
  fiberByProvider: new Map(),
});

/**
 * This worker effect is the main entry-point for the media provider worker and
 * upon initialization, it sets up itself to resolve messages from the main
 * thread.
 */
const worker = Stream.fromEventListener<MessageEvent>(self, "message").pipe(
  Stream.runForEach((event) =>
    Effect.gen(function* () {
      const message = yield* decodeWorkerMessage(event.data);

      return yield* Match.type<WorkerMessage>().pipe(
        Match.tag("init", (message) => init(message)),
        Match.exhaustive,
      )(message);
    }),
  ),
  Effect.provide(WorkerLive),
  Effect.provideServiceEffect(WorkerStateRef, initialState),
  Effect.scoped,
);

Effect.runPromise(worker);