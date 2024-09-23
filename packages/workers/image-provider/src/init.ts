import { Effect, Fiber, Match, Stream } from "effect";
import * as S from "@effect/schema/Schema";
import { MediaProviderStatus } from "@echo/core-types";
import { syncArtistsImages } from "./artist-image-sync";

export const InitMessage = S.TaggedStruct("init", {});
type InitMessage = S.Schema.Type<typeof InitMessage>;

export const initMessageDecoder = S.decode(InitMessage);
export const initMessageEncoder = S.encode(InitMessage);

/**
 * Initializes the image provider worker.
 */
export const init = () =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing image provider worker...");

    const providerStatusRef = yield* MediaProviderStatus.observe;
    const providerStatusFiber = yield* providerStatusRef.changes.pipe(
      Stream.flatMap((status) => Stream.fromIterable(status.entries())),
      Stream.runForEach(([providerId, providerStatus]) =>
        Match.value(providerStatus).pipe(
          Match.tag("synced", () =>
            Effect.gen(function* () {
              yield* Effect.log(
                `Triggering image sync after ${providerId} has synced.`,
              );

              yield* syncArtistsImages;
            }),
          ),
          Match.orElse(() => Effect.void),
        ),
      ),
      Effect.forkDaemon,
    );

    yield* Effect.log(
      "ImageProvider worker initialized, awaiting status fiber.",
    );
    yield* Fiber.await(providerStatusFiber);
  });
