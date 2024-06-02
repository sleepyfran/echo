import { BroadcastChannelLive } from "@echo/infrastructure-broadcast-channel";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { Effect, Match, Stream } from "effect";
import * as S from "@effect/schema/Schema";
import { InitMessage, init } from "./init";

export const WorkerMessage = S.Union(InitMessage);
type WorkerMessage = S.Schema.Type<typeof WorkerMessage>;

const decodeWorkerMessage = S.decode(WorkerMessage);

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
  Effect.provide(BroadcastChannelLive),
  Effect.provide(BrowserCryptoLive),
  Effect.scoped,
);

Effect.runPromise(worker);
