import {
  Database,
  Library,
  NonExistingArtistReferenced,
  type Album,
  type Artist,
  type DatabaseAlbum,
  type DatabaseArtist,
  type DatabaseTrack,
  type Table,
  type Track,
} from "@echo/core-types";
import { Effect, Layer, Option, Stream } from "effect";

/**
 * Implementation of the library service using the database as the source.
 */
export const LibraryLive = Layer.effect(
  Library,
  Effect.gen(function* () {
    const database = yield* Database;

    return Library.of({
      observeAlbums: () =>
        Effect.gen(function* () {
          const albumsTable = yield* database.table("albums");
          const artistsTable = yield* database.table("artists");
          const allAlbums = yield* albumsTable.observe();

          return allAlbums.pipe(
            Stream.mapEffect((albums) =>
              resolveAllAlbums(albums, artistsTable),
            ),
            Stream.map(sortAlbumsByArtistName),
          );
        }),
      artistDetail: (artistId) =>
        Effect.gen(function* () {
          const artistsTable = yield* database.table("artists");
          const albumsTable = yield* database.table("albums");

          const artist = yield* artistsTable.byId(artistId);
          const albums = yield* albumsTable
            .filtered({
              filter: {
                artistId,
              },
              sort: {
                field: "releaseYear",
                direction: "desc",
              },
            })
            .pipe(
              Effect.flatMap((albums) =>
                resolveAllAlbums(albums, artistsTable),
              ),
            );

          return artist.pipe(
            Option.map((artist) => ({
              artist: toArtistSchema(artist),
              albums,
            })),
          );
        }),
      albumDetail: (albumId) =>
        Effect.gen(function* () {
          const albumsTable = yield* database.table("albums");
          const artistsTable = yield* database.table("artists");
          const tracksTable = yield* database.table("tracks");

          const maybeAlbum = yield* albumsTable.byId(albumId);
          if (Option.isNone(maybeAlbum)) {
            return Option.none();
          }

          const maybeArtist = yield* artistsTable.byId(
            maybeAlbum.value.artistId,
          );
          if (Option.isNone(maybeArtist)) {
            return yield* Effect.fail(
              new NonExistingArtistReferenced(
                maybeAlbum.value.name,
                maybeAlbum.value.artistId,
              ),
            );
          }

          const tracks = yield* tracksTable.filtered({
            filter: {
              albumId,
            },
          });

          const album = yield* toAlbumSchema(maybeAlbum.value, maybeArtist);
          return Option.some({
            ...album,
            tracks: tracks
              .sort((a, b) => a.trackNumber - b.trackNumber)
              .map((track) => toTrackSchema(track, album, album.artist)),
          });
        }),
      observeArtists: () =>
        Effect.gen(function* () {
          const artistsTable = yield* database.table("artists");
          const allArtists = yield* artistsTable.observe();

          return allArtists.pipe(
            Stream.map((artists) =>
              sortArtistsByName(artists.map(toArtistSchema)),
            ),
            Stream.catchAll(() => Stream.empty),
          );
        }),
    });
  }),
);

const resolveAllAlbums = (
  albums: DatabaseAlbum[],
  artistsTable: Table<"artists", DatabaseArtist>,
): Effect.Effect<Album[], NonExistingArtistReferenced> =>
  Effect.all(
    albums.map((album) =>
      artistsTable
        .byId(album.artistId)
        .pipe(Effect.flatMap((artist) => toAlbumSchema(album, artist))),
    ),
    {
      concurrency: 4,
    },
  );

const toAlbumSchema = (
  album: DatabaseAlbum,
  artist: Option.Option<DatabaseArtist>,
): Effect.Effect<Album, NonExistingArtistReferenced> => {
  if (Option.isNone(artist)) {
    return Effect.fail(
      new NonExistingArtistReferenced(album.name, album.artistId),
    );
  }

  return Effect.succeed({
    ...album,
    artist: toArtistSchema(artist.value),
    embeddedCover: Option.fromNullable(album.embeddedCover),
    releaseYear: Option.fromNullable(album.releaseYear),
  });
};

const toArtistSchema = (artist: DatabaseArtist): Artist => ({
  ...artist,
  image: Option.fromNullable(artist.image),
});

const toTrackSchema = (
  track: DatabaseTrack,
  album: Album,
  artist: Artist,
): Track => ({
  ...track,
  albumInfo: album,
  mainArtist: artist,
  secondaryArtists: [],
});

const sortAlbumsByArtistName = (albums: Album[]): Album[] =>
  albums.sort((a, b) => a.artist.name.localeCompare(b.artist.name));

const sortArtistsByName = (artists: Artist[]): Artist[] =>
  artists.sort((a, b) => a.name.localeCompare(b.name));
