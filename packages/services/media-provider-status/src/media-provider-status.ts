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
      Stream.runForEach(({ startArgs, status }) => {
        return Ref.update(stateByProviderRef, (current) => {
          const updatedMap = new Map(current);

          if (status._tag === "stopped") {
            updatedMap.delete(startArgs.metadata.id);
          } else {
            updatedMap.set(startArgs.metadata.id, status);
          }

          return updatedMap;
        });
      }),
      Effect.forkScoped,
    );

    return MediaProviderStatus.of({
      observe: Effect.sync(() => stateByProviderRef),
    });
  }),
);
