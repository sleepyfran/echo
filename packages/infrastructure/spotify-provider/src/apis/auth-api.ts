import * as S from "@effect/schema/Schema";
import {
  HttpApi,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import { SpotifyAuthenticationResponse } from "./types";

const AuthorizeEndpoint = HttpApiEndpoint.post("authorize", "/api/token").pipe(
  HttpApiEndpoint.setSuccess(SpotifyAuthenticationResponse),
  HttpApiEndpoint.setPath(
    S.Struct({
      grant_type: S.Literal("authorization_code"),
      code: S.String,
      redirect_uri: S.String,
    }),
  ),
  HttpApiEndpoint.setHeaders(
    S.Struct({
      Authorization: S.String,
      "Content-Type": S.Literal("application/x-www-form-urlencoded"),
    }),
  ),
);

const RefreshTokenEndpoint = HttpApiEndpoint.post(
  "refreshToken",
  "/api/token",
).pipe(
  HttpApiEndpoint.setSuccess(SpotifyAuthenticationResponse),
  HttpApiEndpoint.setPath(
    S.Struct({
      grant_type: S.Literal("refresh_token"),
      refresh_token: S.String,
    }),
  ),
  HttpApiEndpoint.setHeaders(
    S.Struct({
      Authorization: S.String,
      "Content-Type": S.Literal("application/x-www-form-urlencoded"),
    }),
  ),
);

const AuthApiGroup = HttpApiGroup.make("auth").pipe(
  HttpApiGroup.add(AuthorizeEndpoint),
  HttpApiGroup.add(RefreshTokenEndpoint),
);

/**
 * API client for the Spotify authentication API.
 */
export const AuthApi = HttpApiClient.make(
  HttpApi.empty.pipe(HttpApi.addGroup(AuthApiGroup)),
  {
    baseUrl: "https://accounts.spotify.com",
  },
);
