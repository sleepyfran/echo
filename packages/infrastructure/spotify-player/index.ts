import {
  MediaPlayerFactory,
  MediaPlayerId,
  ProviderType,
} from "@echo/core-types";
import { Effect, Layer, Stream } from "effect";
import { initSpotifyPlayer, loadSpotifyPlaybackSDK } from "./src/lib";
import { PlayerApi } from "./src/apis/player-api";

const make = Effect.gen(function* () {
  const playerApi = yield* PlayerApi;

  return MediaPlayerFactory.of({
    createMediaPlayer: (authInfo) =>
      Effect.gen(function* () {
        yield* Effect.log("Creating Spotify player, attempting to load SDK.");

        yield* loadSpotifyPlaybackSDK;
        const player = yield* initSpotifyPlayer(authInfo);

        yield* Effect.log("Spotify player is ready.");

        const togglePlayback = Effect.promise(player.pause);

        return {
          _tag: ProviderType.ApiBased,
          id: MediaPlayerId("spotify-player"),
          playTrack: (trackId) =>
            Effect.scoped(
              playerApi.player.playTrack({
                headers: {
                  Authorization: `Bearer ${authInfo.accessToken}`,
                },
                path: {
                  context_uri: `spotify:track:${trackId}`,
                  position_ms: "0",
                },
              }),
            ),
          togglePlayback,
          observe: Stream.async((emit) => {
            player.addListener("player_state_changed", (state) => {
              if (state.paused) {
                return emit.single("trackPaused");
              }

              if (state.position === 0) {
                return emit.single("trackPlaying");
              }

              if (
                state.position === state.track_window.current_track.duration_ms
              ) {
                return emit.single("trackEnded");
              }
            });
          }),
          dispose: Effect.sync(() => player.disconnect()),
        };
      }),
  });
});

/**
 * Implementation of the media player service using the Spotify Web Playback SDK.
 */
export const SpotifyMediaPlayerFactoryLive = Layer.scoped(
  MediaPlayerFactory,
  make,
);
