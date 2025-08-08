import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { SpotifyUserSavedAlbumsResponse } from "./types";
import { Effect, Layer, pipe } from "effect";
import type { ParseError } from "effect/ParseResult";
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
    HttpClientError.HttpClientError | ParseError
  >;
};

export class SpotifyLibraryApi extends Effect.Tag(
  "@echo/spotify-provider/SpotifyLibraryApi",
)<SpotifyLibraryApi, ISpotifyLibraryApi>() {}

export const SpotifyLibraryApiLive = Layer.scoped(
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
