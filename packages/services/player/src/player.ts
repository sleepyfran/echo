import { Player, type PlayerState } from "@echo/core-types";
import { Effect, Layer, Option, PubSub, Ref, Stream } from "effect";
import { PlayerStateRef } from "./state";

const PlayerLiveWithState = Layer.effect(
  Player,
  Effect.gen(function* () {
    const state = yield* PlayerStateRef;
    const statePubSub = yield* PubSub.dropping<PlayerState>({
      capacity: 1,
      replay: 1,
    });

    // Yield initial state to subscribers.
    yield* statePubSub.publish(yield* state.get);

    return Player.of({
      playAlbum: (_album) =>
        Effect.gen(function* () {
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
  }),
);

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
