import { Effect, Fiber, Match, Stream, SubscriptionRef } from "effect";
import { MediaProviderStatus } from "@echo/core-types";
import { syncArtistsImages } from "./artist-image-sync";

/**
 * Initializes the image provider worker.
 */
export const init = () =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing image provider worker...");

    const providerStatus = yield* MediaProviderStatus;
    const providerStatusRef = yield* providerStatus.observe;
    const providerStatusFiber = yield* SubscriptionRef.changes(
      providerStatusRef,
    ).pipe(
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
      Effect.forkDetach,
    );

    yield* Effect.log(
      "ImageProvider worker initialized, awaiting status fiber.",
    );
    yield* Fiber.await(providerStatusFiber);
  });
