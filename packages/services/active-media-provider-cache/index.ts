import {
  ActiveMediaProviderCache,
  BroadcastListener,
  ProviderStatusChanged,
  type MediaProviderById,
} from "@echo/core-types";
import { Effect, Layer, Option, Ref, Stream, SubscriptionRef } from "effect";

const makeActiveMediaProviderCache = Effect.gen(function* () {
  const providerByIdRef = yield* SubscriptionRef.make<MediaProviderById>(
    new Map(),
  );
  const broadcastListener = yield* BroadcastListener;

  const statusStream = yield* broadcastListener.listen(
    "mediaProvider",
    ProviderStatusChanged,
  );

  // Listen to status updates of the media providers and remove them from the
  // cache once they become inactive.
  yield* statusStream.pipe(
    Stream.runForEach(({ startArgs, status }) => {
      if (status._tag !== "stopped") {
        return Effect.void;
      }

      return Ref.update(providerByIdRef, (current) => {
        const updatedMap = new Map(current);
        updatedMap.delete(startArgs.metadata.id);
        return updatedMap;
      }).pipe(
        Effect.andThen(
          Effect.log(
            `Removed provider ${startArgs.metadata.id} from cache because it was stopped`,
          ),
        ),
      );
    }),
    Effect.forkScoped,
  );

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
    observe: providerByIdRef.changes.pipe(
      Stream.map((providerMap) => Array.from(providerMap.values())),
    ),
  });
});

export const ActiveMediaProviderCacheLive = Layer.scoped(
  ActiveMediaProviderCache,
  makeActiveMediaProviderCache,
);
