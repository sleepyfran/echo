import * as S from "effect/Schema";
import { Data, Effect, Match } from "effect";
import { InitFinishedMessage, InitMessage } from "./src/init";

export class WorkerInitializationError extends Data.TaggedError(
  "@echo/workers-media-provider/WorkerInitializationError",
)<{}> {}

/**
 * Creates the media provider worker and initializes it, awaiting the worker
 * to notify that the initialization has finished.
 */
export const initializeMediaProviderWorker = Effect.async<void>(
  (resolveEff) => {
    const worker = new Worker(
      new URL("./src/media-provider.worker", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (message: MessageEvent<unknown>) => {
      const decoder = S.decodeUnknownEither(InitFinishedMessage);
      const decodedMessage = decoder(message.data);

      Match.value(decodedMessage).pipe(
        Match.tag("Left", () => {
          // If we receive a message that we can't decode as the init finished
          // then most likely we haven't initialized the worker correctly.
          // This worker is critical, so there's no point in attempting to
          // do anything else if it fails to initialize.
          resolveEff(Effect.die(new WorkerInitializationError()));
        }),
        Match.tag("Right", () => {
          resolveEff(Effect.succeed(void 0));
        }),
        Match.exhaustive,
      );
    };

    worker.postMessage(InitMessage.make({}));
  },
).pipe(Effect.timeout("5 seconds"), Effect.orDie);
