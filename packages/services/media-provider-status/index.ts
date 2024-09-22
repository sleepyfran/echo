import {
  MediaProviderStatus,
  MediaProviderMainThreadBroadcastChannel,
  type StateByProvider,
} from "@echo/core-types";
import { Effect, Layer, Ref, SubscriptionRef } from "effect";

export const MediaProviderStatusLive = Layer.effect(
  MediaProviderStatus,
  Effect.gen(function* () {
    const stateByProviderRef = yield* SubscriptionRef.make<StateByProvider>(
      new Map(),
    );
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

    yield* broadcastChannel.registerResolver("reportStatus", (status) => {
      return Ref.update(stateByProviderRef, (current) => {
        return new Map(current).set(status.metadata.id, status.status);
      });
    });

    return MediaProviderStatus.of({
      observe: Effect.sync(() => stateByProviderRef),
    });
  }),
);
