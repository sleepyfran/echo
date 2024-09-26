import { MediaProviderFactory } from "@echo/core-types";
import { Effect, Layer } from "effect";
import { SpotifyAuthentication } from "./spotify-authentication";
import { UserLibraryApi } from "./apis/user-library-api";
import { createListAlbums } from "./apis/list-albums-api";

export const SpotifyProviderLive = Layer.effect(
  MediaProviderFactory,
  Effect.gen(function* () {
    const spotifyAuth = yield* SpotifyAuthentication;
    const userLibraryApi = yield* UserLibraryApi;

    return MediaProviderFactory.of({
      authenticationProvider: Effect.succeed(spotifyAuth),
      createMediaProvider: (authInfo) => ({
        _tag: "ApiBased",
        listAlbums: createListAlbums(authInfo, userLibraryApi),
      }),
    });
  }),
);
