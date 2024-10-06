import {
  MediaProviderStatus,
  MediaProviderMainThreadBroadcastChannel,
  type StateByProvider,
} from "@echo/core-types";
import { Effect, Layer, Ref, SubscriptionRef } from "effect";

/**
 * Implementation of the media provider status service that keeps the latest
 * status of each provider in a subscription ref.
 */
export const MediaProviderStatusLive = Layer.effect(
  MediaProviderStatus,
  Effect.gen(function* () {
    const stateByProviderRef = yield* SubscriptionRef.make<StateByProvider>(
      new Map(),
    );
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

    yield* broadcastChannel.registerResolver(
      "reportStatus",
      ({ startArgs, status }) => {
        return Ref.update(stateByProviderRef, (current) => {
          return new Map(current).set(startArgs.metadata.id, status);
        });
      },
    );

    return MediaProviderStatus.of({
      observe: Effect.sync(() => stateByProviderRef),
    });
  }),
);
