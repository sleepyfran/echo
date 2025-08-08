import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { SpotifyAuthenticationResponse, SpotifyRefreshResponse } from "./types";
import { Effect, Layer, pipe } from "effect";
import { AppConfig } from "@echo/core-types";
import type { ParseError } from "effect/ParseResult";
import type { Struct } from "effect/Schema";
import { createClient } from "./client";

const SPOTIFY_AUTH_BASE = "https://accounts.spotify.com";

export type ISpotifyAuthApi = {
  /**
   * Performs a POST request to retrieve an access token from Spotify.
   */
  readonly retrieveToken: (
    code: string,
  ) => Effect.Effect<
    SpotifyAuthenticationResponse,
    HttpClientError.HttpClientError | ParseError
  >;

  /**
   * Performs a POST request to refresh an access token from Spotify.
   */
  readonly refreshToken: (
    refreshToken: string,
  ) => Effect.Effect<
    SpotifyRefreshResponse,
    HttpClientError.HttpClientError | ParseError
  >;
};

export class SpotifyAuthApi extends Effect.Tag(
  "@echo/spotify-provider/SpotifyAuthApi",
)<SpotifyAuthApi, ISpotifyAuthApi>() {}

export const SpotifyAuthApiLive = Layer.scoped(
  SpotifyAuthApi,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    const httpClient = yield* createClient;

    const requestAndTransform = <T extends Struct.Fields>(
      req: HttpClientRequest.HttpClientRequest,
      bodySchema: Struct<T>,
    ) =>
      pipe(
        req,
        HttpClientRequest.basicAuth(
          appConfig.spotify.clientId,
          appConfig.spotify.secret,
        ),
        httpClient.execute,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(bodySchema)),
        Effect.scoped,
      );

    return SpotifyAuthApi.of({
      retrieveToken: (code) =>
        requestAndTransform(
          createRetrieveTokenRequest(appConfig, code),
          SpotifyAuthenticationResponse,
        ),
      refreshToken: (refreshToken) =>
        requestAndTransform(
          createRefreshTokenRequest(refreshToken),
          SpotifyRefreshResponse,
        ),
    });
  }),
);

const createRetrieveTokenRequest = (appConfig: AppConfig, code: string) =>
  HttpClientRequest.post(`${SPOTIFY_AUTH_BASE}/api/token`).pipe(
    HttpClientRequest.setUrlParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: appConfig.spotify.redirectUri,
    }),
    HttpClientRequest.setHeader(
      "Content-Type",
      "application/x-www-form-urlencoded",
    ),
  );

const createRefreshTokenRequest = (refreshToken: string) =>
  HttpClientRequest.post(`${SPOTIFY_AUTH_BASE}/api/token`).pipe(
    HttpClientRequest.appendUrlParam("grant_type", "refresh_token"),
    HttpClientRequest.appendUrlParam("refresh_token", refreshToken),
    HttpClientRequest.setHeader(
      "Content-Type",
      "application/x-www-form-urlencoded",
    ),
  );
