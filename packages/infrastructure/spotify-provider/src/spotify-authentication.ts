import {
  AppConfig,
  AuthenticationError,
  SpotifySpecificAuthenticationInfo,
  type Authentication,
  type AuthenticationInfo,
} from "@echo/core-types";
import {
  Context,
  Data,
  Effect,
  Either,
  Layer,
  pipe,
  Schedule,
  Option,
  Match,
} from "effect";
import { DEFAULT_SCOPES, SPOTIFY_AUTH_URL } from "./constants";
import { AuthApi } from "./apis/auth-api";
import { addSeconds } from "@echo/core-dates";
import type { SpotifyAuthenticationResponse } from "./apis/types";

export class UnableToOpenWindow extends Data.TaggedError(
  "@echo/spotify-provider/UnableToOpenWindow",
)<{}> {}

/**
 * Tag to identify the Spotify implementation of the Authentication interface.
 */
export const SpotifyAuthentication = Context.GenericTag<Authentication>(
  "@echo/infrastructure-spotify-provider/SpotifyAuthentication",
);

type CodeOrError = Option.Option<Either.Either<string, string>>;

const make = Effect.gen(function* () {
  const appConfig = yield* AppConfig;
  const authApi = yield* AuthApi;

  const connect = Effect.gen(function* () {
    const loginPopup = yield* Effect.acquireRelease(
      openLoginPopup(appConfig),
      (window) => Effect.sync(window.close),
    );

    const authenticationCode = yield* tryRetrieveAuthenticationCode(loginPopup);

    const authResponse = yield* authApi.auth.authorize({
      path: {
        code: authenticationCode,
        grant_type: "authorization_code",
        redirect_uri: createRedirectUri(appConfig),
      },
      headers: {
        Authorization: createBasicAuthHeader(appConfig),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return toAuthenticationInfo(authResponse);
  }).pipe(
    Effect.catchAll(() => Effect.fail(AuthenticationError.Unknown)),
    Effect.scoped,
  );

  const connectSilent = (cachedCredentials: AuthenticationInfo) =>
    Effect.gen(function* () {
      if (cachedCredentials.providerSpecific._tag !== "Spotify") {
        yield* Effect.logError(
          "Cached credentials are not Spotify-specific, cannot connect silently",
        );
        return yield* Effect.fail(AuthenticationError.WrongCredentials);
      }

      const authResponse = yield* authApi.auth.refreshToken({
        headers: {
          Authorization: createBasicAuthHeader(appConfig),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        path: {
          grant_type: "refresh_token",
          refresh_token: cachedCredentials.providerSpecific.refreshToken,
        },
      });

      return toAuthenticationInfo(authResponse);
    }).pipe(
      Effect.catchAll(() => Effect.fail(AuthenticationError.Unknown)),
      Effect.scoped,
    );

  return SpotifyAuthentication.of({
    connect,
    connectSilent,
  });
});

/**
 * Implementation of the authentication interface that uses Spotify as the provider.
 * Exports a layer that can be used to construct the service, which will use
 * the Spotify API to authenticate the user.
 */
export const SpotifyAuthenticationLive = Layer.scoped(
  SpotifyAuthentication,
  make,
);

const authCheckRepeatPolicy = pipe(
  Schedule.recurUntil((codeOrError: CodeOrError) => Option.isSome(codeOrError)),
  Schedule.addDelay(() => "1 second"),
);

/**
 * Attempts to retrieve the authentication code from the window. If the code is
 * not present, it will keep trying every second until either we get a code,
 * an error, or a timeout of 1 minute occurs.
 */
const tryRetrieveAuthenticationCode = (window: Window) =>
  Effect.repeat(
    retrieveCodeOrErrorFromWindow(window),
    authCheckRepeatPolicy,
  ).pipe(
    Effect.timeout("1 minute"),
    Effect.map(Option.getOrThrow), // The schedule should ensure that a code or error is present.
    Effect.flatMap((codeOrError) =>
      Match.value(codeOrError).pipe(
        Match.tag("Right", (code) => Effect.succeed(code.right)),
        Match.orElse(() =>
          Effect.fail(() => AuthenticationError.InteractionFailed),
        ),
      ),
    ),
    Effect.mapError(() => AuthenticationError.InteractionTimedOut),
  );

/**
 * Opens the Spotify auth page in a popup window.
 */
const openLoginPopup = (appConfig: AppConfig) => {
  const width = 500;
  const height = 800;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  return pipe(
    Effect.sync(() =>
      window.open(
        createAuthUrl(appConfig),
        "Spotify",
        `popup=true, width=${width}, height=${height}, top=${top}, left=${left}`,
      ),
    ),
    Effect.flatMap((window) =>
      window ? Effect.succeed(window) : Effect.fail(new UnableToOpenWindow()),
    ),
    Effect.tapError(() =>
      Effect.logError("Failed to open Spotify login window"),
    ),
  );
};

/**
 * Attempts to read the authentication code or error from the URL search
 * parameters of a window.
 */
const retrieveCodeOrErrorFromWindow = (window: Window) =>
  Effect.sync(() => {
    const parsedUrl = new URL(window.location.href);
    const code = parsedUrl.searchParams.get("code");
    const error = parsedUrl.searchParams.get("error");

    if (code) {
      return Option.some(Either.right(code));
    } else if (error) {
      return Option.some(Either.left(error));
    }

    return Option.none();
  });

const createAuthUrl = (appConfig: AppConfig) =>
  `${SPOTIFY_AUTH_URL}?response_type=code&client_id=${appConfig.spotify.clientId}&scope=${DEFAULT_SCOPES}&redirect_uri=${createRedirectUri(appConfig)}`;

const createRedirectUri = (appConfig: AppConfig) =>
  `${appConfig.echo.baseUrl}/auth/spotify/callback`;

const createBasicAuthHeader = (appConfig: AppConfig) =>
  `Basic ${btoa(`${appConfig.spotify.clientId}:${appConfig.spotify.secret}`)}`;

const toAuthenticationInfo = (
  spotifyAuthInfo: SpotifyAuthenticationResponse,
): AuthenticationInfo => ({
  accessToken: spotifyAuthInfo.access_token,
  expiresOn: addSeconds(new Date(), spotifyAuthInfo.expires_in),
  providerSpecific: SpotifySpecificAuthenticationInfo.make({
    refreshToken: spotifyAuthInfo.refresh_token,
  }),
});
