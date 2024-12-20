import {
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
  Layer,
  Match,
  pipe,
  Queue,
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
  | { _tag: "Dispose" };

const { CallbackRegistered, PlayerCreated, PlayerReady } =
  Data.taggedEnum<InitCommand>();

const { PlayTrack, TogglePlayback, Stop, Dispose } =
  Data.taggedEnum<SpotifyPlayerCommand>();

const make = Effect.gen(function* () {
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

        yield* Effect.log(
          "Registering playback SDK callback in the background",
        );

        const deferredUntilRegistered = yield* Deferred.make<undefined>();

        yield* Stream.async<InitCommand>((emit) => {
          window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
              name: "Echo",
              getOAuthToken: (cb) => cb(authInfo.accessToken),
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
                    setupListeners(player, mediaPlayerEventQueue),
                  ),
                  Effect.andThen(() =>
                    consumeCommandsInBackground(
                      { authInfo, deviceId },
                      { playerApi, player },
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
          playTrack: (trackId) => commandQueue.offer(PlayTrack({ trackId })),
          togglePlayback: commandQueue.offer(TogglePlayback()),
          stop: commandQueue.offer(Stop()),
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
          Effect.sync(() => player.togglePlay()),
        ),
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
  mediaPlayerEventQueue: Queue.Enqueue<MediaPlayerEvent>,
) =>
  Effect.sync(() => {
    player.addListener("player_state_changed", (state) => {
      const currentTrackId = state.track_window.current_track.id;
      const previousTrackID = state.track_window.previous_tracks[0]?.id;

      /*
      There's no reliable way of detecting when a track has ended via this listener
      (or any other API provided via the SDK/Web API). However when a song finishes
      there's an event that adds the track that was just played to the previous_tracks
      array, so if we detect that the current track is the same as the previous track
      and the position is 0 while simultaneously being paused, we can assume that the
      previous track has ended.
      */
      if (
        state.position === 0 &&
        state.paused &&
        currentTrackId === previousTrackID
      ) {
        return mediaPlayerEventQueue.unsafeOffer("trackEnded");
      }

      if (state.paused) {
        mediaPlayerEventQueue.unsafeOffer("trackPaused");
      } else {
        mediaPlayerEventQueue.unsafeOffer("trackPlaying");
      }
    });
  });

/**
 * Implementation of the media player service using the Spotify Web Playback SDK.
 */
export const SpotifyMediaPlayerFactoryLive = Layer.scoped(
  MediaPlayerFactory,
  make,
).pipe(Layer.provide(SpotifyPlayerApiLive));
