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
  Stream,
} from "effect";
import { loadSpotifyPlaybackSDK } from "./src/lib";
import { PlayerApi } from "./src/apis/player-api";

type InitCommand =
  | { _tag: "CallbackRegistered" }
  | { _tag: "PlayerReady"; player: Spotify.Player };

type SpotifyPlayerCommand =
  | { _tag: "PlayTrack"; trackId: TrackId }
  | { _tag: "TogglePlayback" }
  | { _tag: "Dispose" };

const { CallbackRegistered, PlayerReady } = Data.taggedEnum<InitCommand>();

const { PlayTrack, TogglePlayback, Dispose } =
  Data.taggedEnum<SpotifyPlayerCommand>();

const make = Effect.gen(function* () {
  const playerApi = yield* PlayerApi;

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

            player.addListener("ready", () => {
              emit.single(PlayerReady({ player }));
            });
          };

          emit.single(CallbackRegistered());
        }).pipe(
          Stream.runForEach((command) =>
            Match.value(command).pipe(
              Match.tag("CallbackRegistered", () =>
                Deferred.succeed(deferredUntilRegistered, undefined),
              ),
              Match.tag("PlayerReady", ({ player }) =>
                consumeCommandsInBackground(
                  { authInfo },
                  { playerApi, player },
                  commandQueue,
                ).pipe(
                  Effect.andThen(() =>
                    setupListeners(player, mediaPlayerEventQueue),
                  ),
                  Effect.andThen(() =>
                    Effect.log("Player ready and listeners set up"),
                  ),
                ),
              ),
              Match.exhaustive,
            ),
          ),
          Effect.fork,
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
          observe: mediaPlayerEventQueue,
          dispose: commandQueue.offer(Dispose()),
        };
      }),
  });
});

type Dependencies = {
  authInfo: AuthenticationInfo;
};

type Api = {
  playerApi: PlayerApi;
  player: Spotify.Player;
};

const consumeCommandsInBackground = (
  { authInfo }: Dependencies,
  { playerApi, player }: Api,
  commandQueue: Queue.Queue<SpotifyPlayerCommand>,
) =>
  pipe(
    Stream.fromQueue(commandQueue),
    Stream.runForEach((command) =>
      Match.value(command).pipe(
        Match.tag("PlayTrack", ({ trackId }) =>
          playerApi.player
            .playTrack({
              headers: {
                Authorization: `Bearer ${authInfo.accessToken}`,
              },
              path: {
                context_uri: trackId,
                position_ms: "0",
              },
            })
            .pipe(
              Effect.catchAll((e) =>
                Effect.logError("Failed to play track, error", e),
              ),
            ),
        ),
        Match.tag("TogglePlayback", () =>
          Effect.sync(() => player.togglePlay()),
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
  Stream.async<MediaPlayerEvent>((emit) => {
    player.addListener("player_state_changed", (state) => {
      if (state.paused) {
        emit.single("trackPaused");
      }

      if (state.position === 0) {
        emit.single("trackPlaying");
      }

      if (state.position === state.track_window.current_track.duration_ms) {
        emit.single("trackEnded");
      }
    });
  }).pipe(
    Stream.runForEach((event: MediaPlayerEvent) =>
      mediaPlayerEventQueue.offer(event),
    ),
  );

/**
 * Implementation of the media player service using the Spotify Web Playback SDK.
 */
export const SpotifyMediaPlayerFactoryLive = Layer.scoped(
  MediaPlayerFactory,
  make,
);
