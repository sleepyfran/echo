import {
  ActiveMediaProviderCache,
  Paused,
  Player,
  Playing,
  PlayNotFoundError,
  ProviderNotReady,
  ProviderType,
  Stopped,
  type IActiveMediaProviderCache,
  type MediaPlayer,
  type MediaProvider,
  type PlayerState,
  type Track,
} from "@echo/core-types";
import {
  Array,
  Data,
  Effect,
  Exit,
  Layer,
  Match,
  Option,
  pipe,
  Queue,
  Ref,
  Scope,
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
  | { _tag: "PlaybackChanged"; isPlaying: boolean }
  | { _tag: "SyncPlayerState"; withMediaPlayer: MediaPlayer }
  | { _tag: "UpdateState"; updateFn: (state: PlayerState) => PlayerState };

const { NextTrack, UpdateState, SyncPlayerState, PlaybackChanged } =
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
  const activeMediaPlayer = yield* CurrentlyActivePlayerRef;

  const commandQueue = yield* Queue.sliding<PlayerCommand>(10);
  yield* consumeCommandsInBackground(commandQueue);

  return Player.of({
    playAlbum: (album) =>
      playTracks({
        tracks: album.tracks,
        providerCache,
        commandQueue,
        preservePreviousTracks: false,
      }).pipe(
        Effect.catchTag("NoMoreTracksAvailable", () =>
          Effect.logError(
            `Attempted to play album ${album.name}, but it has no tracks.`,
          ),
        ),
      ),
    togglePlayback: Effect.gen(function* () {
      const mediaPlayer = yield* activeMediaPlayer.get;
      if (Option.isNone(mediaPlayer)) {
        yield* Effect.logWarning(
          "Attempted to toggle playback with no media player active.",
        );
        return;
      }

      yield* mediaPlayer.value.player.togglePlayback;
    }),
    previous: Effect.gen(function* () {
      // TODO: Refactor this to avoid duplication with other play commands.
      const { previouslyPlayedTracks, comingUpTracks, status } =
        yield* Ref.get(state);
      const lastPlayedTrack = Array.last(previouslyPlayedTracks);
      if (Option.isNone(lastPlayedTrack)) {
        yield* Effect.logWarning(
          "Attempted to play previous track, but the previous queue is empty",
        );
        return;
      }

      const { provider, player } = yield* resolveDependenciesForTrack(
        providerCache,
        lastPlayedTrack.value,
      );

      const currentTrack = Match.value(status).pipe(
        Match.tag("Playing", ({ track }) => [track]),
        Match.tag("Paused", ({ track }) => [track]),
        Match.tag("Stopped", () => []),
        Match.exhaustive,
      );
      const previousWithoutLast = Array.dropRight(previouslyPlayedTracks, 1);
      const comingUpWithCurrent = [...currentTrack, ...comingUpTracks];

      yield* playTrack(provider, player, lastPlayedTrack.value);
      yield* commandQueue.offer(
        UpdateState({
          updateFn: (state) => ({
            ...state,
            status: Playing({ track: lastPlayedTrack.value }),
            previouslyPlayedTracks: previousWithoutLast,
            comingUpTracks: comingUpWithCurrent,
          }),
        }),
      );
    }),
    skip: commandQueue.offer(NextTrack()),
    observe: Effect.sync(() => state),
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
            yield* playTracks({
              tracks: comingUpTracks,
              providerCache,
              commandQueue,
            }).pipe(
              Effect.catchTag("NoMoreTracksAvailable", () =>
                Effect.logWarning("There are no more tracks to play."),
              ),
            );
          }),
        ),
        Match.tag("PlaybackChanged", ({ isPlaying }) =>
          Effect.gen(function* () {
            yield* Effect.log(
              `Playback changed to ${isPlaying ? "playing" : "paused"}`,
            );

            yield* commandQueue.offer(
              UpdateState({
                updateFn: (state) =>
                  Match.value(state.status).pipe(
                    Match.tag("Playing", ({ track }) =>
                      isPlaying
                        ? state
                        : { ...state, status: Paused({ track }) },
                    ),
                    Match.tag("Paused", ({ track }) =>
                      isPlaying
                        ? { ...state, status: Playing({ track }) }
                        : state,
                    ),
                    Match.tag("Stopped", () => state),
                    Match.exhaustive,
                  ),
              }),
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

type PlayTracksInput = {
  tracks: Track[];
  providerCache: IActiveMediaProviderCache;
  commandQueue: Queue.Enqueue<PlayerCommand>;
  preservePreviousTracks?: boolean;
};

/**
 * Given a list of tracks, a provider cache and a command queue, attempts to play
 * the first track in the list and updates the player state accordingly.
 */
const playTracks = ({
  tracks,
  providerCache,
  commandQueue,
  preservePreviousTracks = true,
}: PlayTracksInput) =>
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
      UpdateState({
        updateFn: toPlayingState(
          nextTrack,
          restOfTracks,
          preservePreviousTracks,
        ),
      }),
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
    const activePlayer = yield* activeMediaPlayer.get;
    if (Option.isSome(activePlayer)) {
      if (activePlayer.value.player.id === mediaPlayer.id) {
        yield* Effect.log(
          `Player ${mediaPlayer.id} is already active, skipping subscription.`,
        );
        return;
      }

      yield* Effect.log(
        `Disposing of the current player ${activePlayer.value.player.id}.`,
      );
      yield* Scope.close(activePlayer.value.scope, Exit.void);
    }

    yield* Effect.log(`Setting player ${mediaPlayer.id} as active.`);

    const playerScope = yield* Scope.make();
    yield* Ref.set(
      activeMediaPlayer,
      Option.some({
        player: mediaPlayer,
        scope: playerScope,
      }),
    );

    yield* Effect.log(`Starting to observe player ${mediaPlayer.id}.`);
    yield* pipe(
      mediaPlayer.observe,
      Stream.ensuring(
        Effect.log(`Stream from player ${mediaPlayer.id} has stopped.`),
      ),
      Stream.runForEach((event) =>
        Match.value(event).pipe(
          Match.when("trackPlaying", () =>
            commandQueue.offer(PlaybackChanged({ isPlaying: true })),
          ),
          Match.when("trackEnded", () => commandQueue.offer(NextTrack())),
          Match.when("trackPaused", () =>
            commandQueue.offer(PlaybackChanged({ isPlaying: false })),
          ),
          Match.exhaustive,
        ),
      ),
      Effect.forkIn(playerScope),
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
        if (
          provider._tag !== ProviderType.FileBased ||
          player._tag !== ProviderType.FileBased
        ) {
          return Effect.void;
        }

        const file = yield* provider
          .fileUrlById(track.resource.fileId)
          .pipe(Effect.mapError(() => new PlayNotFoundError()));
        yield* player.playFile(file);
        break;
      }
      case "api": {
        if (
          provider._tag !== ProviderType.ApiBased ||
          player._tag !== ProviderType.ApiBased
        ) {
          return Effect.void;
        }

        yield* player.playTrack(track.id);
        break;
      }
    }

    yield* Effect.logInfo(`Playing track ${track.id}`);
  });

/**
 * Returns a function that takes the current player state and returns a new state
 * with the given track playing and the rest of the tracks coming up, updating
 * also the previously played tracks with the current track, if any.
 */
const toPlayingState =
  (currentTrack: Track, comingUpTracks: Track[], preservePrevious = true) =>
  (currentState: PlayerState): PlayerState =>
    ({
      ...currentState,
      status: Playing({ track: currentTrack }),
      previouslyPlayedTracks: preservePrevious
        ? [
            ...currentState.previouslyPlayedTracks,
            ...Match.value(currentState.status).pipe(
              Match.tag("Playing", ({ track }) => [track]),
              Match.tag("Paused", ({ track }) => [track]),
              Match.tag("Stopped", () => []),
              Match.exhaustive,
            ),
          ]
        : [],
      comingUpTracks,
    }) satisfies PlayerState;

const PlayerLiveWithState = Layer.scoped(Player, makePlayer);

const PlayerStateLive = Layer.effect(
  PlayerStateRef,
  SubscriptionRef.make({
    comingUpTracks: [],
    previouslyPlayedTracks: [],
    status: Stopped(),
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
