import {
  ApiBasedProviderId,
  AuthenticationCache,
  MediaPlayerFactory,
  MediaPlayerId,
  ProviderType,
  TrackId,
  type AuthenticationInfo,
  type MediaPlayerEvent,
} from "@echo/core-types";
import {
  Data,
  Deferred,
  Effect,
  Fiber,
  Layer,
  Match,
  Option,
  pipe,
  Queue,
  Ref,
  Runtime,
  Scope,
  Stream,
} from "effect";
import { loadSpotifyPlaybackSDK } from "./src/lib";
import {
  SpotifyPlayerApi,
  SpotifyPlayerApiLive,
  type ISpotifyPlayerApi,
} from "./src/apis/player-api";

type InitCommand =
  | { _tag: "CallbackRegistered" }
  | { _tag: "PlayerCreated"; player: Spotify.Player }
  | { _tag: "PlayerReady"; player: Spotify.Player; deviceId: string };

type SpotifyPlayerCommand =
  | { _tag: "PlayTrack"; trackId: TrackId }
  | { _tag: "TogglePlayback" }
  | { _tag: "Stop" }
  | { _tag: "StartTimeTracking" }
  | { _tag: "SyncTimeTracking"; seconds: number }
  | { _tag: "StopTimeTracking" }
  | { _tag: "Dispose" };

const { CallbackRegistered, PlayerCreated, PlayerReady } =
  Data.taggedEnum<InitCommand>();

const {
  PlayTrack,
  TogglePlayback,
  Stop,
  Dispose,
  StartTimeTracking,
  SyncTimeTracking,
  StopTimeTracking,
} = Data.taggedEnum<SpotifyPlayerCommand>();

const make = Effect.gen(function* () {
  const authCache = yield* AuthenticationCache;
  const playerApi = yield* SpotifyPlayerApi;
  const layerScope = yield* Scope.make();

  return MediaPlayerFactory.of({
    createMediaPlayer: (authInfo) =>
      Effect.gen(function* () {
        yield* Effect.log(
          "Creating Spotify player, initializing SDK in the background.",
        );

        yield* Effect.log("Starting to take commands without processing");
        const commandQueue = yield* Queue.sliding<SpotifyPlayerCommand>(100);

        /*
        This is a way to get around the fact that we won't be able to start
        producing events until the player is ready, instead of blocking the
        initialization until the SDK and the player are ready, we'll expose the
        stream of events from the queue.
        */
        const mediaPlayerEventQueue = yield* Queue.sliding<MediaPlayerEvent>(1);

        const timeTicker = yield* createTimeTicker(
          mediaPlayerEventQueue,
          layerScope,
        );

        yield* Effect.log(
          "Registering playback SDK callback in the background",
        );

        const deferredUntilRegistered = yield* Deferred.make<undefined>();

        const runtime = yield* Effect.runtime();

        yield* Stream.async<InitCommand>((emit) => {
          window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
              name: "Echo",
              getOAuthToken: (cb) =>
                Runtime.runPromise(runtime)(
                  authCache
                    .get(ApiBasedProviderId.Spotify)
                    .pipe(Effect.map(Option.getOrElse(() => authInfo))),
                ).then((authInfo) => cb(authInfo.accessToken)),
              volume: 1.0,
            });

            player.addListener("ready", ({ device_id }) => {
              emit.single(PlayerReady({ player, deviceId: device_id }));
            });

            emit.single(PlayerCreated({ player }));
          };

          emit.single(CallbackRegistered());
        }).pipe(
          Stream.runForEach((command) =>
            Match.value(command).pipe(
              Match.tag("CallbackRegistered", () =>
                Effect.log("SDK callback registered").pipe(
                  Effect.andThen(() =>
                    Deferred.succeed(deferredUntilRegistered, undefined),
                  ),
                ),
              ),
              Match.tag("PlayerCreated", ({ player }) =>
                Effect.log("Player created, calling connect...").pipe(
                  Effect.andThen(() => Effect.promise(() => player.connect())),
                ),
              ),
              Match.tag("PlayerReady", ({ player, deviceId }) =>
                Effect.log("Player is ready, setting up listeners").pipe(
                  Effect.andThen(() =>
                    setupListeners(player, commandQueue, mediaPlayerEventQueue),
                  ),
                  Effect.andThen(() =>
                    consumeCommandsInBackground(
                      { authInfo, deviceId },
                      { playerApi, player },
                      timeTicker,
                      commandQueue,
                    ),
                  ),
                ),
              ),
              Match.exhaustive,
            ),
          ),
          Effect.forkIn(layerScope),
        );

        yield* Effect.log(
          "Waiting for SDK callbacks to be registered before initializing SDK",
        );
        yield* Deferred.await(deferredUntilRegistered);

        yield* Effect.log("Loading Spotify SDK in the background");
        yield* loadSpotifyPlaybackSDK;

        return {
          _tag: ProviderType.ApiBased,
          id: MediaPlayerId("spotify-player"),
          playTrack: (trackId) =>
            Effect.gen(function* () {
              yield* commandQueue.offer(PlayTrack({ trackId }));
              yield* commandQueue.offer(StartTimeTracking());
            }),
          togglePlayback: commandQueue.offer(TogglePlayback()),
          stop: Effect.gen(function* () {
            yield* commandQueue.offer(Stop());
            yield* commandQueue.offer(StopTimeTracking());
          }),
          observe: Stream.fromQueue(mediaPlayerEventQueue),
          dispose: commandQueue.offer(Dispose()),
        };
      }),
  });
});

type Dependencies = {
  authInfo: AuthenticationInfo;
  deviceId: string;
};

type Api = {
  playerApi: ISpotifyPlayerApi;
  player: Spotify.Player;
};

const consumeCommandsInBackground = (
  { authInfo, deviceId }: Dependencies,
  { playerApi, player }: Api,
  timeTicker: TimeTicker,
  commandQueue: Queue.Queue<SpotifyPlayerCommand>,
) =>
  pipe(
    Stream.fromQueue(commandQueue),
    Stream.tap((command) => Effect.log(`Received command: ${command._tag}`)),
    Stream.runForEach((command) =>
      Match.value(command).pipe(
        Match.tag("PlayTrack", ({ trackId }) =>
          playerApi
            .playTrack(deviceId, trackId, authInfo)
            .pipe(
              Effect.catchAll((e) =>
                Effect.logError("Failed to play track, error", e),
              ),
            ),
        ),
        Match.tag("TogglePlayback", () =>
          Effect.gen(function* () {
            const stateBeforeToggling = yield* Effect.promise(() =>
              player.getCurrentState(),
            );
            yield* Effect.promise(() => player.togglePlay());

            if (stateBeforeToggling?.paused) {
              yield* timeTicker.start;
            } else {
              yield* timeTicker.pause;
            }
          }),
        ),
        Match.tag("StartTimeTracking", () => timeTicker.start),
        Match.tag("SyncTimeTracking", ({ seconds }) =>
          timeTicker.sync(seconds),
        ),
        Match.tag("StopTimeTracking", () => timeTicker.stop),
        Match.tag("Stop", () =>
          Effect.all([
            Effect.sync(() => player.pause()),
            Effect.sync(() => player.seek(0)),
          ]),
        ),
        Match.tag("Dispose", () => Effect.sync(() => player.disconnect())),
        Match.exhaustive,
      ),
    ),
  );

const setupListeners = (
  player: Spotify.Player,
  commandQueue: Queue.Enqueue<SpotifyPlayerCommand>,
  mediaPlayerEventQueue: Queue.Enqueue<MediaPlayerEvent>,
) => {
  /*
  Usually I'd be very against having a mutable state here, but since
  this listener triggers in the most unreliable way possible and it's
  impossible to understand when a track has ended without the previous
  state, we need to have this here.
  */
  let previousState: Spotify.PlaybackState | undefined;
  let lastTrackEndedTimestamp = 0;

  return Effect.sync(() => {
    player.addListener("player_state_changed", (state) => {
      if (statesMatch(previousState, state)) {
        return;
      }

      /*
      There's no reliable way of detecting when a track has ended via this listener
      (or any other API provided via the SDK/Web API). However when a song finishes
      there's an event that adds the track that was just played to the previous_tracks
      array, so if we detect that the current track is the same as the previous track
      and the position is 0 while simultaneously being paused, we can assume that the
      previous track has ended. HOWEVER! Somehow this stopped being reliable a few
      months later, so I'm here updating this again :^) For some reason this same
      condition was firing up to four times in a row, with the only difference being
      that the last one has the loading flag set to false and the duration exposed
      in the previous state differed from the current one by a millisecond. So we
      need to keep those into account as well. Let's see when this breaks again,
      can't wait, yay!

      Feb 2025 update - 2 months ago me probably thought he was done with this,
      but guess what! I've figured that the best way for now to detect is by keeping
      the base conditions intact (position is 0 and it's paused), but instead of
      checking for whether the previous track is the same or not, since we're only
      playing one song at a time and we don't rely on Spotify's queue at all, we
      can simply check whether there's a previous track AND! have some debounce
      time to avoid triggering this twice in a few seconds because for some reason
      even after we've gotten the track ended event and we task Spotify with playing
      another track it triggers ANOTHER event with the same payload and the same
      previous_tracks array.  So only fire this event if we detect that the previous
      timestamp was more than 5 seconds ago. Hello me from the future, hope you're
      having a good day! :^)
      */
      if (
        state.position === 0 &&
        state.paused &&
        !!state.track_window.previous_tracks.length &&
        state.timestamp - lastTrackEndedTimestamp > 5000
      ) {
        lastTrackEndedTimestamp = state.timestamp;
        mediaPlayerEventQueue.unsafeOffer({ _tag: "trackEnded" });
        commandQueue.unsafeOffer(StopTimeTracking());
        return;
      }

      /*
      We also need this funky checks to detect that the previous state differs
      from the current one to avoid triggering double pauses and plays, since
      that messes up the switching of tracks when a track ends.
      */
      if (state.paused && !previousState?.paused) {
        mediaPlayerEventQueue.unsafeOffer({ _tag: "trackPaused" });
      } else if (!state.paused && previousState?.paused) {
        mediaPlayerEventQueue.unsafeOffer({ _tag: "trackPlaying" });
      } else if (previousState?.position !== state.position) {
        const positionInSeconds = Math.floor(state.position / 1000);
        commandQueue.unsafeOffer(
          SyncTimeTracking({ seconds: positionInSeconds }),
        );
      }

      previousState = state;
    });
  });
};

const statesMatch = (
  previousState: Spotify.PlaybackState | undefined,
  currentState: Spotify.PlaybackState,
) =>
  previousState?.loading === currentState.loading &&
  previousState?.paused === currentState.paused &&
  previousState?.position === currentState.position &&
  previousState?.track_window.current_track.id ===
    currentState.track_window.current_track.id;

type TimeTicker = {
  start: Effect.Effect<void>;
  sync: (seconds: number) => Effect.Effect<void>;
  pause: Effect.Effect<void>;
  stop: Effect.Effect<void>;
};

const createTimeTicker = (
  mediaPlayerEventQueue: Queue.Enqueue<MediaPlayerEvent>,
  scope: Scope.Scope,
): Effect.Effect<TimeTicker> =>
  Effect.gen(function* () {
    const fiberRef = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);
    const lastSecondRef = yield* Ref.make(0);

    const stopAndCleanupState = (fiber: Fiber.Fiber<void, never>) =>
      Effect.gen(function* () {
        yield* Fiber.interrupt(fiber);
        yield* Ref.set(fiberRef, null);
        yield* Ref.set(lastSecondRef, 0);
      });

    return {
      /**
       * Starts a ticker that sends an update for the `trackTimeChanged` event
       * every second. This is needed because, Spotify's API, being as friend
       * as it is, doesn't actually send status updates every second and instead
       * does so every 30 seconds or so. So instead of having a counter that
       * displays really, really out of sync times, we manually tick them and
       * allow the state update to still override this if needed.
       */
      start: Effect.gen(function* () {
        const currentFiber = yield* Ref.get(fiberRef);
        if (currentFiber) {
          yield* Effect.log(
            "Running fiber detected while starting the time ticker, cancelling before proceeding...",
          );
          yield* stopAndCleanupState(currentFiber);
        }

        yield* Effect.log("Starting Spotify player's time ticker");

        yield* Ref.set(
          fiberRef,
          yield* Effect.forkIn(
            /*
            Run the update function forever until interrupted, with a second
            delay in between to properly compute the time change.

            Note: This value will still be overridden whenever Spotify decides
            to send a new playback state update. This is expected and indeed
            desired to keep the counter properly in sync with the actual song
            and account for changes that might occur due to Spotify Connect.
             */
            Effect.forever(
              Effect.gen(function* () {
                const updatedTime = yield* Ref.updateAndGet(
                  lastSecondRef,
                  (prev) => prev + 1,
                );

                yield* mediaPlayerEventQueue.offer({
                  _tag: "trackTimeChanged",
                  time: updatedTime,
                });
              }).pipe(Effect.delay("1 second")),
            ),
            scope,
          ),
        );
      }),

      /**
       * Syncs the time ticker with the current playback position.
       */
      sync: (seconds: number) =>
        Effect.gen(function* () {
          yield* Effect.log(`Syncing time ticker with ${seconds} seconds`);
          yield* Ref.set(lastSecondRef, seconds);
        }),

      /**
       * Pauses the time ticker, preventing further updates until resumed.
       */
      pause: Effect.gen(function* () {
        yield* Effect.log("Pausing Spotify player's time ticker");
        const fiber = yield* Ref.get(fiberRef);
        if (fiber) {
          yield* Fiber.interrupt(fiber);
          yield* Ref.set(fiberRef, null);
        }
      }),

      /**
       * Stops the time ticker, which effectively removes the updates, and
       * resets the fibers and internal states.
       */
      stop: Effect.gen(function* () {
        yield* Effect.log("Stopping Spotify player's time ticker");
        const fiber = yield* Ref.get(fiberRef);

        if (fiber) {
          yield* stopAndCleanupState(fiber);
        }
      }),
    };
  });

/**
 * Implementation of the media player service using the Spotify Web Playback SDK.
 */
export const SpotifyMediaPlayerFactoryLive = Layer.scoped(
  MediaPlayerFactory,
  make,
).pipe(Layer.provide(SpotifyPlayerApiLive));
