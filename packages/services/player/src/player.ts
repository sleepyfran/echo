import {
  ActiveMediaProviderCache,
  Player,
  PlayNotFoundError,
  ProviderNotReady,
  type PlayerState,
} from "@echo/core-types";
import { Effect, Layer, Option, PubSub, Ref, Stream } from "effect";
import { PlayerStateRef } from "./state";

const makePlayer = Effect.gen(function* () {
  const state = yield* PlayerStateRef;
  const providerCache = yield* ActiveMediaProviderCache;

  // TODO: Remove all this and switch to subscription ref.
  const statePubSub = yield* PubSub.dropping<PlayerState>({
    capacity: 1,
    replay: 1,
  });

  // Yield initial state to subscribers.
  yield* statePubSub.publish(yield* state.get);

  return Player.of({
    playAlbum: (album) =>
      Effect.gen(function* () {
        // TODO: Make work with more than just the first track.
        const firstTrack = album.tracks[0];
        if (!firstTrack) {
          return;
        }

        const streamingProvider = firstTrack.resource.provider;
        const provider = yield* providerCache.get(streamingProvider);
        if (Option.isNone(provider)) {
          yield* Effect.logError(
            `Attempted to play track ${firstTrack.id}, which is registered with the provider ${streamingProvider}, but the provider is not active.`,
          );
          return yield* Effect.fail(new ProviderNotReady(streamingProvider));
        }

        switch (firstTrack.resource.type) {
          case "file": {
            const file = yield* provider.value.provider
              .fileUrlById(firstTrack.resource.fileId)
              .pipe(Effect.mapError(() => new PlayNotFoundError()));
            yield* provider.value.player.playFile(file);
            break;
          }
          default:
            // TODO: Remove once API streaming is implemented.
            return Effect.void;
        }

        yield* Ref.update(state, (current) => ({
          ...current,
          status: "playing" as const,
        }));

        yield* statePubSub.publish(yield* state.get);
      }),
    observe: Effect.sync(() =>
      Stream.fromPubSub(statePubSub).pipe(
        Stream.tap((state) => Effect.logInfo("Player state changed", state)),
        Stream.ensuring(Effect.logInfo("Player state stream closed")),
      ),
    ),
  });
});

const PlayerLiveWithState = Layer.effect(Player, makePlayer);

const PlayerStateLive = Layer.effect(
  PlayerStateRef,
  Ref.make({
    comingUpTracks: [],
    previouslyPlayedTracks: [],
    currentTrack: Option.none(),
    status: "stopped",
  } as PlayerState),
);

export const PlayerLive = PlayerLiveWithState.pipe(
  Layer.provide(PlayerStateLive),
);
