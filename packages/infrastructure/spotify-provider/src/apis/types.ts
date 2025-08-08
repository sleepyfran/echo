import * as S from "effect/Schema";

/**
 * Response from the Spotify authentication API.
 */
export const SpotifyAuthenticationResponse = S.Struct({
  access_token: S.String,
  token_type: S.String,
  expires_in: S.Number,
  scope: S.String,
  refresh_token: S.String,
});

export type SpotifyAuthenticationResponse = S.Schema.Type<
  typeof SpotifyAuthenticationResponse
>;

/**
 * Response from the Spotify authentication API that only omits the refresh token,
 * since it's not returned in the refresh token response.
 */
export const SpotifyRefreshResponse = S.Struct({
  access_token: S.String,
  token_type: S.String,
  expires_in: S.Number,
  scope: S.String,
});

export type SpotifyRefreshResponse = S.Schema.Type<
  typeof SpotifyRefreshResponse
>;

/**
 * Response from the Spotify API that represents an album.
 */
export const SpotifyAlbumResponse = S.Struct({
  album_type: S.Union(
    S.Literal("album"),
    S.Literal("single"),
    S.Literal("compilation"),
  ),
  artists: S.Array(
    S.Struct({
      external_urls: S.Struct({
        spotify: S.String,
      }),
      href: S.String,
      id: S.String,
      name: S.String,
      type: S.String,
      uri: S.String,
    }),
  ),
  tracks: S.Struct({
    href: S.String,
    total: S.Number,
    items: S.Array(
      S.Struct({
        artists: S.Array(
          S.Struct({
            external_urls: S.Struct({
              spotify: S.String,
            }),
            href: S.String,
            id: S.String,
            name: S.String,
            type: S.String,
            uri: S.String,
          }),
        ),
        duration_ms: S.Number,
        id: S.String,
        name: S.String,
        track_number: S.Number,
      }),
    ),
  }),
  id: S.String,
  images: S.Array(
    S.Struct({
      height: S.Number,
      url: S.String,
      width: S.Number,
    }),
  ),
  name: S.String,
  release_date: S.String,
});
export type SpotifyAlbumResponse = S.Schema.Type<typeof SpotifyAlbumResponse>;

/**
 * Response from the Spotify API that represents a a list of albums saved by the
 * user.
 */
export const SpotifyUserSavedAlbumsResponse = S.Struct({
  href: S.String,
  items: S.Array(
    S.Struct({
      album: SpotifyAlbumResponse,
      added_at: S.String,
    }),
  ),
  limit: S.Number,
  next: S.NullOr(S.String),
  offset: S.Number,
  previous: S.NullOr(S.String),
});
export type SpotifyUserSavedAlbumsResponse = S.Schema.Type<
  typeof SpotifyUserSavedAlbumsResponse
>;
