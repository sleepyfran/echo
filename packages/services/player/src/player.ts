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
  Data,
  Effect,
  Layer,
  Match,
  Option,
  pipe,
  Queue,
  Ref,
  Stream,
  SubscriptionRef,
} from "effect";
import {
  CurrentlyActivePlayerRef,
  PlayerStateRef,
  type ICurrentlyActivePlayerRef,
} from "./state";

/**
 * Internal commands that can be sent to the player to trigger actions. Mostly
 * used to synchronize the player state with the media player's events.
 */
type PlayerCommand =
  | { _tag: "NextTrack" }
  | { _tag: "SyncPlayerState"; withMediaPlayer: MediaPlayer }
  | { _tag: "UpdateState"; updateFn: (state: PlayerState) => PlayerState };

const { NextTrack, UpdateState, SyncPlayerState } =
  Data.taggedEnum<PlayerCommand>();

/**
 * Error thrown when the player was asked to play a track but the list of tracks
 * was empty.
 */
class NoMoreTracksAvailable extends Data.TaggedError(
  "NoMoreTracksAvailable",
)<{}> {}

const makePlayer = Effect.gen(function* () {
  const state = yield* PlayerStateRef;
  const providerCache = yield* ActiveMediaProviderCache;

  const commandQueue = yield* Queue.sliding<PlayerCommand>(10);
  yield* consumeCommandsInBackground(commandQueue);

  return Player.of({
    playAlbum: (album) =>
      playTracks(album.tracks, providerCache, commandQueue).pipe(
        Effect.catchTag("NoMoreTracksAvailable", () =>
          Effect.logError(
            `Attempted to play album ${album.name}, but it has no tracks.`,
          ),
        ),
      ),
    observe: state,
  });
});

/**
 * Consumes the player commands in the background, triggering the appropriate
 * actions based on the command type.
 */
const consumeCommandsInBackground = (
  commandQueue: Queue.Queue<PlayerCommand>,
) =>
  pipe(
    Stream.fromQueue(commandQueue),
    Stream.runForEach((command) =>
      Match.value(command).pipe(
        Match.tag("NextTrack", () =>
          Effect.gen(function* () {
            const state = yield* PlayerStateRef;
            const providerCache = yield* ActiveMediaProviderCache;

            const { comingUpTracks } = yield* Ref.get(state);
            yield* playTracks(comingUpTracks, providerCache, commandQueue).pipe(
              Effect.catchTag("NoMoreTracksAvailable", () =>
                Effect.logWarning("There are no more tracks to play."),
              ),
            );
          }),
        ),
        Match.tag("UpdateState", ({ updateFn }) =>
          Effect.gen(function* () {
            const state = yield* PlayerStateRef;
            yield* Ref.update(state, updateFn);
          }),
        ),
        Match.tag("SyncPlayerState", ({ withMediaPlayer }) =>
          Effect.gen(function* () {
            const activeMediaPlayer = yield* CurrentlyActivePlayerRef;
            yield* syncPlayerState(
              withMediaPlayer,
              activeMediaPlayer,
              commandQueue,
            );
          }),
        ),
        Match.exhaustive,
      ),
    ),
    Effect.forkScoped,
  );

/**
 * Given a list of tracks, a provider cache and a command queue, attempts to play
 * the first track in the list and updates the player state accordingly.
 */
const playTracks = (
  tracks: Track[],
  providerCache: IActiveMediaProviderCache,
  commandQueue: Queue.Enqueue<PlayerCommand>,
) =>
  Effect.gen(function* () {
    const [nextTrack, ...restOfTracks] = tracks;
    if (!nextTrack) {
      return yield* Effect.fail(new NoMoreTracksAvailable());
    }

    const { provider, player } = yield* resolveDependenciesForTrack(
      providerCache,
      nextTrack,
    );

    yield* commandQueue.offer(SyncPlayerState({ withMediaPlayer: player }));
    yield* playTrack(provider, player, nextTrack);
    yield* commandQueue.offer(
      UpdateState({ updateFn: toPlayingState(nextTrack, restOfTracks) }),
    );
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
  commandQueue: Queue.Enqueue<PlayerCommand>,
) =>
  Effect.gen(function* () {
    const currentMediaPlayer = yield* activeMediaPlayer.get;
    if (Option.isSome(currentMediaPlayer)) {
      if (currentMediaPlayer.value.id === mediaPlayer.id) {
        yield* Effect.log(
          `Player ${mediaPlayer.id} is already active, skipping subscription.`,
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

    yield* Effect.log(`Starting to observe player ${mediaPlayer.id}.`);

    // TODO: Do not use daemon, we need to scope this to the player's lifecycle.
    yield* Effect.forkDaemon(
      mediaPlayer.observe.pipe(
        Stream.tap((event) =>
          Match.value(event).pipe(
            Match.when("trackPlaying", () => Effect.void),
            Match.when("trackEnded", () => commandQueue.offer(NextTrack())),
            Match.when("trackPaused", () => Effect.void),
            Match.exhaustive,
          ),
        ),
        Stream.runDrain,
      ),
    );
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
  (currentState: PlayerState): PlayerState =>
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

const PlayerLiveWithState = Layer.scoped(Player, makePlayer);

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
