import {
  ActiveMediaProviderCache,
  Player,
  PlayNotFoundError,
  ProviderNotReady,
  type IActiveMediaProviderCache,
  type MediaPlayer,
  type MediaProvider,
  type PlayerState,
  type Track,
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

        const providerDependencies = yield* resolveDependenciesForTrack(
          providerCache,
          track,
        );
        yield* playTrack(providerDependencies, track);
        yield* Ref.update(state, toPlayingState(track, restOfTracks));
      }),
    observe: state,
  });
});

/**
 * Attempts to retrieve the provider assigned by its resource for the given
 * track. If the provider is not active, logs an error and fails the effect.
 */
const resolveDependenciesForTrack = (
  providerCache: IActiveMediaProviderCache,
  track: Track,
) =>
  providerCache.get(track.resource.provider).pipe(
    Effect.flatMap((maybeProvider) =>
      Option.isSome(maybeProvider)
        ? Effect.succeed(maybeProvider.value)
        : Effect.fail(new ProviderNotReady(track.resource.provider)),
    ),
    Effect.tapError(() =>
      Effect.logError(
        `Attempted to play track ${track.id}, which is registered with the provider ${track.resource.provider}, but the provider is not active.`,
      ),
    ),
  );

/**
 * Given a provider and a player, attempts to resolve the track's source
 * based on its resource type and play it.
 */
const playTrack = (
  { provider, player }: { provider: MediaProvider; player: MediaPlayer },
  track: Track,
) =>
  Effect.gen(function* () {
    switch (track.resource.type) {
      case "file": {
        const file = yield* provider
          .fileUrlById(track.resource.fileId)
          .pipe(Effect.mapError(() => new PlayNotFoundError()));
        yield* player.playFile(file);
        break;
      }
      default:
        // TODO: Remove once API streaming is implemented.
        return Effect.void;
    }

    yield* Effect.logInfo(`Playing track ${track.id}`);
  });

/**
 * Returns a function that takes the current player state and returns a new state
 * with the given track playing and the rest of the tracks coming up, updating
 * also the previously played tracks with the current track, if any.
 */
const toPlayingState =
  (currentTrack: Track, comingUpTracks: Track[]) =>
  (currentState: PlayerState) =>
    ({
      ...currentState,
      status: "playing" as const,
      currentTrack: Option.some(currentTrack),
      previouslyPlayedTracks: [
        ...currentState.previouslyPlayedTracks,
        ...(Option.isSome(currentState.currentTrack)
          ? [currentState.currentTrack.value]
          : []),
      ],
      comingUpTracks,
    }) satisfies PlayerState;

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
