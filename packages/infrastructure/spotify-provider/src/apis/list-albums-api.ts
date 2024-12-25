import { Effect, Option } from "effect";
import type { ISpotifyLibraryApi } from "./user-library-api";
import {
  AlbumId,
  ApiBasedProviderError,
  ApiBasedProviderId,
  ArtistId,
  TrackId,
  type Album,
  type Artist,
  type AuthenticationInfo,
  type IAuthenticationCache,
  type Track,
} from "@echo/core-types";
import type { SpotifyAlbumResponse } from "./types";

const initialState = {
  maybeOffset: Option.some(0),
  albums: [],
} as { maybeOffset: Option.Option<number>; albums: Album[] };

/**
 * Creates an effect that retrieves all the albums in the user's library.
 */
export const createListAlbums = (
  fallbackAuthInfo: AuthenticationInfo,
  authCache: IAuthenticationCache,
  userLibraryApi: ISpotifyLibraryApi,
) =>
  Effect.iterate(initialState, {
    while: ({ maybeOffset }) => Option.isSome(maybeOffset),
    body: (state) =>
      Effect.gen(function* () {
        const { maybeOffset, albums } = state;

        if (Option.isNone(maybeOffset)) {
          return state;
        }

        const authInfoOrFallback = yield* authCache
          .get(ApiBasedProviderId.Spotify)
          .pipe(Effect.map(Option.getOrElse(() => fallbackAuthInfo)));

        const response = yield* userLibraryApi
          .savedAlbums({
            authInfo: authInfoOrFallback,
            offset: maybeOffset.value,
            limit: 50,
          })
          .pipe(
            Effect.tapError((error) =>
              Effect.logError(
                `An error happened while fetching albums from Spotify: ${error}`,
              ),
            ),
          );

        const previousOffset = response.offset;
        const nextOffset = response.next
          ? Option.some(previousOffset + response.limit)
          : Option.none();
        const nextAlbums = yield* Effect.all(
          response.items.map((response) => resolveAlbum(response.album)),
        );

        return {
          maybeOffset: nextOffset,
          albums: [...albums, ...nextAlbums],
        };
      }),
  }).pipe(
    Effect.map(({ albums }) => albums),
    Effect.catchAll(() => Effect.fail(ApiBasedProviderError.NotFound)),
  );

const resolveAlbum = (
  spotifyAlbum: SpotifyAlbumResponse,
): Effect.Effect<Album> =>
  Effect.gen(function* () {
    const albumCover = yield* downloadImage(spotifyAlbum.images[0]?.url);
    // TODO: Should we check for empty arrays here?
    const artist = toArtistSchema(spotifyAlbum.artists[0]);
    const parsedYear = spotifyAlbum.release_date.split("-")[0];
    const releaseYear = parsedYear
      ? Option.some(Number(parsedYear))
      : Option.none();

    return {
      artist,
      embeddedCover: albumCover,
      id: AlbumId(spotifyAlbum.id),
      name: spotifyAlbum.name,
      genres: [],
      providerId: ApiBasedProviderId.Spotify,
      releaseYear,
      tracks: spotifyAlbum.tracks.items.map((track) =>
        toTrackSchema(artist, track),
      ),
    };
  });

const toArtistSchema = (
  spotifyArtist: SpotifyAlbumResponse["artists"][0],
): Artist => ({
  id: ArtistId(spotifyArtist.id),
  image: Option.none(),
  name: spotifyArtist.name,
});

const toTrackSchema = (
  artist: Artist,
  spotifyTrack: SpotifyAlbumResponse["tracks"]["items"][0],
): Track => ({
  id: TrackId(spotifyTrack.id),
  name: spotifyTrack.name,
  mainArtist: artist,
  resource: {
    type: "api",
    provider: ApiBasedProviderId.Spotify,
  },
  secondaryArtists: [],
  trackNumber: spotifyTrack.track_number,
  durationInSeconds: spotifyTrack.duration_ms / 1000,
});

const downloadImage = (url?: string) =>
  url
    ? Effect.tryPromise<Blob>(() =>
        fetch(url).then((response) => response.blob()),
      ).pipe(Effect.option)
    : Effect.succeed(Option.none());
