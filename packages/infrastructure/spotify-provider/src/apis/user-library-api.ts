import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { SpotifyUserSavedAlbumsResponse } from "./types";
import { Context, Effect, Layer, pipe } from "effect";
import type { SchemaError } from "effect/Schema";
import type { AuthenticationInfo } from "@echo/core-types";
import { createClient } from "./client";

const SPOTIFY_API_BASE = "https://api.spotify.com";

export type ISpotifyLibraryApi = {
  /**
   * Retrieves the user's saved albums.
   */
  readonly savedAlbums: (opts: {
    authInfo: AuthenticationInfo;
    offset: number;
    limit: number;
  }) => Effect.Effect<
    SpotifyUserSavedAlbumsResponse,
    HttpClientError.HttpClientError | SchemaError
  >;
};

export class SpotifyLibraryApi extends Context.Service<
  SpotifyLibraryApi,
  ISpotifyLibraryApi
>()("@echo/spotify-provider/SpotifyLibraryApi") {}

export const SpotifyLibraryApiLive = Layer.effect(
  SpotifyLibraryApi,
  Effect.gen(function* () {
    const httpClient = yield* createClient;

    return SpotifyLibraryApi.of({
      savedAlbums: ({ authInfo, offset, limit }) =>
        pipe(
          createAlbumsRequest(authInfo, offset, limit),
          httpClient.execute,
          Effect.flatMap(
            HttpClientResponse.schemaBodyJson(SpotifyUserSavedAlbumsResponse),
          ),
          Effect.scoped,
        ),
    });
  }),
);

const createAlbumsRequest = (
  authInfo: AuthenticationInfo,
  offset: number,
  limit: number,
) =>
  HttpClientRequest.get(`${SPOTIFY_API_BASE}/v1/me/albums`).pipe(
    HttpClientRequest.setUrlParams({
      limit,
      offset,
    }),
    HttpClientRequest.bearerToken(authInfo.accessToken),
  );
