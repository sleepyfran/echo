import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
} from "@effect/platform";
import { Effect, Layer, pipe } from "effect";
import type { AuthenticationInfo, TrackId } from "@echo/core-types";
import type { HttpBodyError } from "@effect/platform/HttpBody";

const SPOTIFY_API_BASE = "https://api.spotify.com";

export type ISpotifyPlayerApi = {
  /**
   * Sends a POST request to the Spotify player API to play a track.
   */
  readonly playTrack: (
    deviceId: string,
    trackId: TrackId,
    authInfo: AuthenticationInfo,
  ) => Effect.Effect<void, HttpClientError.HttpClientError | HttpBodyError>;
};

export class SpotifyPlayerApi extends Effect.Tag(
  "@echo/spotify-player/SpotifyPlayerApi",
)<SpotifyPlayerApi, ISpotifyPlayerApi>() {}

export const SpotifyPlayerApiLive = Layer.scoped(
  SpotifyPlayerApi,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    return SpotifyPlayerApi.of({
      playTrack: (deviceId, trackId, authInfo) =>
        pipe(
          createPlayRequest(deviceId, trackId, authInfo),
          Effect.flatMap(httpClient.execute),
          /*
            Disable tracing for this request, otherwise a `b3` and `traceparent` header
            will be added to the request and the request will fail with CORS.
            */
          HttpClient.withTracerPropagation(false),
          Effect.scoped,
          Effect.asVoid,
        ),
    });
  }),
);

const createPlayRequest = (
  deviceId: string,
  trackId: TrackId,
  authInfo: AuthenticationInfo,
) =>
  HttpClientRequest.put(
    `${SPOTIFY_API_BASE}/v1/me/player/play?device_id=${deviceId}`,
  ).pipe(
    HttpClientRequest.bearerToken(authInfo.accessToken),
    HttpClientRequest.bodyJson({
      uris: [`spotify:track:${trackId}`],
      position_ms: 0,
    }),
  );
