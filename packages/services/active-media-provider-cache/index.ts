import {
  ActiveMediaProviderCache,
  MediaProviderMainThreadBroadcastChannel,
  type MediaProviderById,
} from "@echo/core-types";
import { Effect, Layer, Option, Ref } from "effect";

const makeActiveMediaProviderCache = Effect.gen(function* () {
  const providerByIdRef = yield* Ref.make<MediaProviderById>(new Map());
  const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

  // Listen to status updates of the media providers and remove them from the
  // cache once they become inactive.
  yield* broadcastChannel.registerResolver("reportStatus", (status) => {
    if (status.status._tag !== "stopped") {
      return Effect.void;
    }

    return Ref.update(providerByIdRef, (current) => {
      const updatedMap = new Map(current);
      updatedMap.delete(status.metadata.id);
      return updatedMap;
    }).pipe(
      Effect.andThen(
        Effect.log(
          `Removed provider ${status.metadata.id} from cache because it was stopped`,
        ),
      ),
    );
  });

  return ActiveMediaProviderCache.of({
    add: (metadata, provider, player) =>
      Ref.update(providerByIdRef, (current) => {
        const updatedMap = new Map(current);
        updatedMap.set(metadata.id, {
          metadata,
          provider,
          player,
        });
        return updatedMap;
      }).pipe(
        Effect.andThen(Effect.log(`Added provider ${metadata.id} to cache`)),
      ),
    get: (providerId) =>
      Ref.get(providerByIdRef).pipe(
        Effect.map((providerMap) => {
          const cachedProvider = providerMap.get(providerId);
          if (!cachedProvider) {
            return Option.none();
          }

          return Option.some({
            provider: cachedProvider.provider,
            player: cachedProvider.player,
          });
        }),
      ),
    getAll: Effect.gen(function* () {
      const providerMap = yield* Ref.get(providerByIdRef);
      return Array.from(providerMap.values());
    }),
  });
});

export const ActiveMediaProviderCacheLive = Layer.effect(
  ActiveMediaProviderCache,
  makeActiveMediaProviderCache,
);
