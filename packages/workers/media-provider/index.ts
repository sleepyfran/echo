import * as S from "effect/Schema";
import { Data, Effect, Result } from "effect";
import { InitFinishedMessage } from "./src/init";
import MediaProviderWorker from "./src/media-provider.worker?worker";

export class WorkerInitializationError extends Data.TaggedError(
  "@echo/workers-media-provider/WorkerInitializationError",
)<{}> {}

/**
 * Creates the media provider worker and initializes it, awaiting the worker
 * to notify that the initialization has finished.
 */
export const initializeMediaProviderWorker = Effect.callback<void>(
  (resolveEff) => {
    const worker = new MediaProviderWorker();

    worker.onmessage = (message: MessageEvent<unknown>) => {
      const decoder = S.decodeUnknownResult(InitFinishedMessage);
      const decodedMessage = decoder(message.data);

      if (Result.isFailure(decodedMessage)) {
        // If we receive a message that we can't decode as the init finished
        // then most likely we haven't initialized the worker correctly.
        // This worker is critical, so there's no point in attempting to
        // do anything else if it fails to initialize.
        resolveEff(Effect.die(new WorkerInitializationError()));
      } else {
        resolveEff(Effect.succeed(void 0));
      }
    };
  },
).pipe(Effect.timeout("5 seconds"), Effect.orDie);
