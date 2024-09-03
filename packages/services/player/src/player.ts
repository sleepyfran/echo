import {
  ActiveMediaProviderCache,
  Player,
  PlayNotFoundError,
  ProviderNotReady,
  type PlayerState,
} from "@echo/core-types";
import { Effect, Layer, Option, Ref, SubscriptionRef } from "effect";
import { PlayerStateRef } from "./state";

const makePlayer = Effect.gen(function* () {
  const state = yield* PlayerStateRef;
  const providerCache = yield* ActiveMediaProviderCache;

  return Player.of({
    playAlbum: (album) =>
      Effect.gen(function* () {
        const [track, ...restOfTracks] = album.tracks;
        if (!track) {
          yield* Effect.logError(
            `Attempted to play album ${album.name}, but it has no tracks.`,
          );
          return;
        }

        const streamingProvider = track.resource.provider;
        const provider = yield* providerCache.get(streamingProvider);
        if (Option.isNone(provider)) {
          yield* Effect.logError(
            `Attempted to play track ${track.id}, which is registered with the provider ${streamingProvider}, but the provider is not active.`,
          );
          return yield* Effect.fail(new ProviderNotReady(streamingProvider));
        }

        switch (track.resource.type) {
          case "file": {
            const file = yield* provider.value.provider
              .fileUrlById(track.resource.fileId)
              .pipe(Effect.mapError(() => new PlayNotFoundError()));
            yield* provider.value.player.playFile(file);
            break;
          }
          default:
            // TODO: Remove once API streaming is implemented.
            return Effect.void;
        }

        yield* Effect.log(`Playing album ${album.name}`);

        yield* Ref.update(state, (current) => ({
          ...current,
          status: "playing" as const,
          currentTrack: Option.some(track),
          previouslyPlayedTracks: [
            ...current.previouslyPlayedTracks,
            ...(Option.isSome(current.currentTrack)
              ? [current.currentTrack.value]
              : []),
          ],
          comingUpTracks: restOfTracks,
        }));
      }),
    observe: state,
  });
});

const PlayerLiveWithState = Layer.effect(Player, makePlayer);

const PlayerStateLive = Layer.effect(
  PlayerStateRef,
  SubscriptionRef.make({
    comingUpTracks: [],
    previouslyPlayedTracks: [],
    currentTrack: Option.none(),
    status: "stopped",
  } as PlayerState),
);

export const PlayerLive = PlayerLiveWithState.pipe(
  Layer.provide(PlayerStateLive),
);
