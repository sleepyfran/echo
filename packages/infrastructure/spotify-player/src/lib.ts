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
