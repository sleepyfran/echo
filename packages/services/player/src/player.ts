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
  type Album,
  Loading,
} from "@echo/core-types";
import {
  Array,
  Data,
  Effect,
  Exit,
  Layer,
  Match,
  Option,
  Order,
  pipe,
  Queue,
  Random,
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
        album,
        providerCache,
        commandQueue,
        preservePreviousTracks: false,
        nextAlbums: [],
      }).pipe(
        Effect.catchTag("NoMoreTracksAvailable", () =>
          Effect.logError(
            `Attempted to play album ${album.name}, but it has no tracks.`,
          ),
        ),
      ),
    playAlbums: ({ albums, order }) =>
      Effect.gen(function* () {
        if (albums.length === 0) {
          yield* Effect.logWarning(
            "Attempted to play albums, but the list was empty.",
          );
          return;
        }

        const sortedAlbums = yield* sortAlbums(albums, order);

        yield* Effect.logInfo(
          `Playing albums in ${order} order: ${sortedAlbums
            .map((album) => album.name)
            .join(",")}`,
        );

        yield* playTracks({
          album: Array.head(sortedAlbums).pipe(Option.getOrThrow),
          providerCache,
          commandQueue,
          preservePreviousTracks: false,
          nextAlbums: Array.tail(sortedAlbums).pipe(Option.getOrElse(() => [])),
        });
      }),
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
      const { previouslyPlayedAlbums, comingUpAlbums, status } =
        yield* Ref.get(state);

      yield* Match.value(status).pipe(
        Match.tag("Playing", "Paused", ({ album, trackIndex }) =>
          Effect.gen(function* () {
            const previousTrack = trackIndex - 1;
            if (previousTrack < 0) {
              yield* Effect.log(
                "No previous track to play, attempting to play last album",
              );
              return yield* playLastFromPreviouslyPlayed(
                previouslyPlayedAlbums,
                providerCache,
                commandQueue,
              );
            }

            yield* playTracks({
              album,
              trackIndex: previousTrack,
              providerCache,
              commandQueue,
              preservePreviousTracks: false,
              nextAlbums: comingUpAlbums,
            });
          }),
        ),
        Match.orElse(() =>
          playLastFromPreviouslyPlayed(
            previouslyPlayedAlbums,
            providerCache,
            commandQueue,
          ),
        ),
      );
    }),
    skip: commandQueue.offer(NextTrack()),
    observe: Effect.sync(() => state),
  });
});

const playLastFromPreviouslyPlayed = (
  previouslyPlayedAlbums: Album[],
  providerCache: IActiveMediaProviderCache,
  commandQueue: Queue.Enqueue<PlayerCommand>,
) =>
  Effect.gen(function* () {
    const lastPlayedAlbum = Array.last(previouslyPlayedAlbums);
    if (Option.isNone(lastPlayedAlbum)) {
      yield* Effect.logWarning(
        "Requested to play previous track, but there's nothing playing nor any previously played albums.",
      );
      return;
    }

    const lastTrack = Array.last(lastPlayedAlbum.value.tracks);
    if (Option.isNone(lastTrack)) {
      yield* Effect.logWarning(
        "Requested to play previous track, but the last played album has no tracks.",
      );
      return;
    }

    yield* playTracks({
      album: lastPlayedAlbum.value,
      trackIndex: lastPlayedAlbum.value.tracks.length - 1,
      providerCache,
      commandQueue,
      preservePreviousTracks: false,
      nextAlbums: [],
    });
  });

const playNextFromComingUp = (
  comingUpAlbums: Album[],
  providerCache: IActiveMediaProviderCache,
  commandQueue: Queue.Enqueue<PlayerCommand>,
) =>
  Effect.gen(function* () {
    const nextAlbum = Array.head(comingUpAlbums);
    if (Option.isNone(nextAlbum)) {
      yield* Effect.logWarning(
        "Requested to play next track, but there are no more tracks coming up.",
      );
      return;
    }

    yield* playTracks({
      album: nextAlbum.value,
      nextAlbums: Array.tail(comingUpAlbums).pipe(Option.getOrElse(() => [])),
      providerCache,
      commandQueue,
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

            const { status, comingUpAlbums } = yield* Ref.get(state);
            yield* Match.value(status).pipe(
              Match.tag("Playing", "Paused", ({ album, trackIndex }) =>
                Effect.gen(function* () {
                  const nextTrack = trackIndex + 1;
                  if (nextTrack >= album.tracks.length) {
                    yield* Effect.log(
                      "No more tracks to play, attempting to play next album",
                    );
                    return yield* playNextFromComingUp(
                      comingUpAlbums,
                      providerCache,
                      commandQueue,
                    );
                  }

                  yield* playTracks({
                    album,
                    trackIndex: nextTrack,
                    providerCache,
                    commandQueue,
                    preservePreviousTracks: false,
                    nextAlbums: comingUpAlbums,
                  });
                }),
              ),
              Match.orElse(() =>
                playNextFromComingUp(
                  comingUpAlbums,
                  providerCache,
                  commandQueue,
                ),
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
                    Match.tag("Loading", () => state),
                    Match.tag("Playing", ({ album, trackIndex }) =>
                      isPlaying
                        ? state
                        : { ...state, status: Paused({ album, trackIndex }) },
                    ),
                    Match.tag("Paused", ({ album, trackIndex }) =>
                      isPlaying
                        ? { ...state, status: Playing({ album, trackIndex }) }
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
  album: Album;
  trackIndex?: number;
  providerCache: IActiveMediaProviderCache;
  commandQueue: Queue.Enqueue<PlayerCommand>;
  preservePreviousTracks?: boolean;
  nextAlbums: Album[];
};

/**
 * Given a list of tracks, a provider cache and a command queue, attempts to play
 * the first track in the list and updates the player state accordingly.
 */
const playTracks = ({
  album,
  trackIndex = 0,
  providerCache,
  commandQueue,
  preservePreviousTracks = true,
  nextAlbums,
}: PlayTracksInput) =>
  Effect.gen(function* () {
    const requestedTrack = Array.get(album.tracks, trackIndex);
    if (Option.isNone(requestedTrack)) {
      return yield* Effect.fail(new NoMoreTracksAvailable());
    }

    const { provider, player } = yield* resolveDependenciesForTrack(
      providerCache,
      requestedTrack.value,
    );

    yield* commandQueue.offer(SyncPlayerState({ withMediaPlayer: player }));
    yield* commandQueue.offer(
      UpdateState({
        updateFn: toLoadingState(album, trackIndex),
      }),
    );
    yield* playTrack(provider, player, requestedTrack.value);
    yield* commandQueue.offer(
      UpdateState({
        updateFn: toPlayingState(
          album,
          trackIndex,
          preservePreviousTracks,
          nextAlbums,
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
        Effect.log(
          `Stream from player ${mediaPlayer.id} has stopped, stopping current playback...`,
        ),
      ),
      Stream.ensuring(mediaPlayer.stop),
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
  (
    album: Album,
    trackIndex: number,
    preservePrevious = true,
    nextAlbums: Album[] = [],
  ) =>
  (currentState: PlayerState) => {
    const hasNext =
      trackIndex + 1 < album.tracks.length ||
      !!currentState.comingUpAlbums.length ||
      !!nextAlbums.length;
    const hasPrevious =
      trackIndex > 0 || !!currentState.previouslyPlayedAlbums.length;

    return {
      ...currentState,
      status: Playing({ album, trackIndex }),
      allowsNext: hasNext,
      allowsPrevious: hasPrevious,
      previouslyPlayedAlbums: preservePrevious
        ? [
            ...currentState.previouslyPlayedAlbums,
            ...Match.value(currentState.status).pipe(
              Match.tag("Loading", () => [album]),
              Match.tag("Playing", ({ album }) => [album]),
              Match.tag("Paused", ({ album }) => [album]),
              Match.tag("Stopped", () => []),
              Match.exhaustive,
            ),
          ]
        : [],
      comingUpAlbums: nextAlbums,
    } satisfies PlayerState;
  };

/**
 * Sets the player state to loading the given track from the given album.
 */
const toLoadingState =
  (album: Album, trackIndex: number) => (currentState: PlayerState) => ({
    ...currentState,
    status: Loading({ album, trackIndex }),
  });

const sortAlbums = (albums: Album[], order: "newest" | "oldest" | "shuffled") =>
  Effect.gen(function* () {
    return order === "shuffled"
      ? Array.fromIterable(yield* Random.shuffle(albums))
      : Array.sortWith(
          albums,
          (album) => album.releaseYear.pipe(Option.getOrElse(() => 0)),
          order === "newest" ? Order.reverse(Order.number) : Order.number,
        );
  });

const PlayerLiveWithState = Layer.scoped(Player, makePlayer);

const PlayerStateLive = Layer.effect(
  PlayerStateRef,
  SubscriptionRef.make({
    allowsNext: false,
    allowsPrevious: false,
    comingUpAlbums: [],
    previouslyPlayedAlbums: [],
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
