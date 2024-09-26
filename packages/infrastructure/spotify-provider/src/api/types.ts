import * as S from "@effect/schema/Schema";

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
