import {
  AuthenticationCache,
  MediaProviderFactory,
  ProviderType,
} from "@echo/core-types";
import { Effect, Layer } from "effect";
import { SpotifyAuthentication } from "./spotify-authentication";
import { SpotifyLibraryApi } from "./apis/user-library-api";
import { createListAlbums } from "./apis/list-albums-api";

/**
 * Implementation of the Spotify provider that uses Spotify for authentication,
 * library discovery and playback. Exports a layer that can be used to either
 * get the authentication provider or create a new instance of the media provider
 * based on the authentication info given by the auth provider.
 */
export const SpotifyProviderLive = Layer.effect(
  MediaProviderFactory,
  Effect.gen(function* () {
    const authCache = yield* AuthenticationCache;
    const spotifyAuth = yield* SpotifyAuthentication;
    const userLibraryApi = yield* SpotifyLibraryApi;

    return MediaProviderFactory.of({
      authenticationProvider: Effect.succeed(spotifyAuth),
      createMediaProvider: (fallbackAuthInfo) => ({
        _tag: ProviderType.ApiBased,
        listAlbums: createListAlbums(
          fallbackAuthInfo,
          authCache,
          userLibraryApi,
        ),
      }),
    });
  }),
);
