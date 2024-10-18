import {
  MediaProviderStatus,
  BroadcastListener,
  type StateByProvider,
  ProviderStatusChanged,
} from "@echo/core-types";
import { Effect, Layer, Ref, Stream, SubscriptionRef } from "effect";

/**
 * Implementation of the media provider status service that keeps the latest
 * status of each provider in a subscription ref.
 */
export const MediaProviderStatusLive = Layer.scoped(
  MediaProviderStatus,
  Effect.gen(function* () {
    const stateByProviderRef = yield* SubscriptionRef.make<StateByProvider>(
      new Map(),
    );
    const broadcastChannel = yield* BroadcastListener;
    const statusStream = yield* broadcastChannel.listen(
      "mediaProvider",
      ProviderStatusChanged,
    );
    yield* statusStream.pipe(
      Stream.ensuring(
        Effect.logError(
          "[Media provider status] No longer listening to provider status changes",
        ),
      ),
      Stream.runForEach(({ startArgs, status }) => {
        return Ref.update(stateByProviderRef, (current) => {
          return new Map(current).set(startArgs.metadata.id, status);
        });
      }),
      Effect.forkScoped,
    );

    return MediaProviderStatus.of({
      observe: Effect.sync(() => stateByProviderRef),
    });
  }),
);
