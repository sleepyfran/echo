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
import {
  Effect,
  Layer,
  Match,
  Option,
  Ref,
  Stream,
  SubscriptionRef,
} from "effect";
import {
  CurrentlyActivePlayerRef,
  PlayerStateRef,
  type ICurrentlyActivePlayerRef,
  type IPlayerStateRef,
} from "./state";

const makePlayer = Effect.gen(function* () {
  const state = yield* PlayerStateRef;
  const activeMediaPlayer = yield* CurrentlyActivePlayerRef;
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

        const { provider, player } = yield* resolveDependenciesForTrack(
          providerCache,
          track,
        );
        yield* syncPlayerState(player, activeMediaPlayer, state);
        yield* playTrack(provider, player, track);
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
 * Given a media player, an active media player reference and a player state reference,
 * synchronizes the player state with the media player's events.
 */
const syncPlayerState = (
  mediaPlayer: MediaPlayer,
  activeMediaPlayer: ICurrentlyActivePlayerRef,
  playerState: IPlayerStateRef,
) =>
  Effect.gen(function* () {
    yield* overrideActivePlayer(mediaPlayer, activeMediaPlayer);

    yield* Effect.log(`Starting to observe player ${mediaPlayer.id}.`);

    yield* Effect.forkDaemon(
      mediaPlayer.observe.pipe(
        Stream.tap((event) =>
          Match.value(event).pipe(
            Match.when("trackPlaying", () =>
              Ref.update(playerState, (currentState) => ({
                ...currentState,
                status: "playing" as const,
              })),
            ),
            Match.when("trackEnded", () =>
              Ref.update(playerState, (currentState) => ({
                ...currentState,
                status: "stopped" as const,
              })),
            ),
            Match.when("trackPaused", () =>
              Ref.update(playerState, (currentState) => ({
                ...currentState,
                status: "paused" as const,
              })),
            ),
            Match.exhaustive,
          ),
        ),
        Stream.runDrain,
      ),
    );
  });

/**
 * Given a media player and an active media player reference, overrides the active
 * player with the given one, disposing of the previous one if any. If the given
 * player is already active, skips the retrieval.
 */
const overrideActivePlayer = (
  mediaPlayer: MediaPlayer,
  activeMediaPlayer: ICurrentlyActivePlayerRef,
) =>
  Effect.gen(function* () {
    const currentMediaPlayer = yield* activeMediaPlayer.get;
    if (Option.isSome(currentMediaPlayer)) {
      if (currentMediaPlayer.value.id === mediaPlayer.id) {
        yield* Effect.log(
          `Player ${mediaPlayer.id} is already active, skipping retrieval.`,
        );
        return;
      }

      yield* Effect.log(
        `Disposing of the current player ${currentMediaPlayer.value.id}.`,
      );
      yield* currentMediaPlayer.value.dispose;
    }

    yield* Effect.log(`Setting player ${mediaPlayer.id} as active.`);
    yield* Ref.set(activeMediaPlayer, Option.some(mediaPlayer));
  });

/**
 * Given a provider and a player, attempts to resolve the track's source
 * based on its resource type and play it.
 */
const playTrack = (
  provider: MediaProvider,
  player: MediaPlayer,
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

const CurrentlyActivePlayerLive = Layer.effect(
  CurrentlyActivePlayerRef,
  SubscriptionRef.make(Option.none()),
);

export const PlayerLive = PlayerLiveWithState.pipe(
  Layer.provide(PlayerStateLive),
  Layer.provide(CurrentlyActivePlayerLive),
);
