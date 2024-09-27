import type { AuthenticationInfo } from "@echo/core-types";
import { Data, Effect } from "effect";

class SpotifySDKLoadFailure extends Data.TaggedError(
  "@echo/infrastructure-spotify-player/SpotifySDKLoadFailure",
)<{}> {}

/**
 * Attempts to load the Spotify SDK, logging the result.
 */
export const loadSpotifyPlaybackSDK = Effect.async((resolveEff) => {
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  script.async = true;
  script.onload = () =>
    resolveEff(Effect.log("Spotify SDK loaded successfully"));
  script.onerror = (error: unknown) => {
    resolveEff(
      Effect.logError(
        `Failed to load Spotify SDK with the following error: ${error}`,
      ).pipe(Effect.map(() => Effect.fail(new SpotifySDKLoadFailure()))),
    );
  };
  document.body.appendChild(script);
});

/**
 * Waits for the Spotify Web Playback SDK to be ready and initializes the player,
 * returning the player instance.
 */
export const initSpotifyPlayer = (authInfo: AuthenticationInfo) =>
  Effect.async<Spotify.Player>((resolveEff) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      resolveEff(
        Effect.gen(function* () {
          yield* Effect.log("Spotify Web Playback SDK ready, initializing...");

          const player = new window.Spotify.Player({
            name: "Echo",
            getOAuthToken: (cb) => cb(authInfo.accessToken),
            volume: 1.0,
          });

          return yield* Effect.async<Spotify.Player>((readyResolveEff) => {
            player.addListener("ready", ({ device_id }) => {
              readyResolveEff(
                Effect.log(`Player ready with device ID: ${device_id}`).pipe(
                  Effect.map(() => player),
                ),
              );
            });
          });
        }),
      );
    };
  });
