import {
  Database,
  Library,
  NonExistingArtistReferenced,
  type Album,
  type Artist,
  type DatabaseAlbum,
  type DatabaseArtist,
  type Table,
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
      observeAlbums: (filter) =>
        Effect.gen(function* () {
          const albumsTable = yield* database.table("albums");
          const artistsTable = yield* database.table("artists");
          const allAlbums = yield* albumsTable.observe();

          return allAlbums.pipe(
            Stream.mapEffect((albums) => {
              const filteredAlbums = filter
                ? albums.filter((album) => album.genres.includes(filter.genre))
                : albums;

              return resolveAllAlbums(filteredAlbums, artistsTable);
            }),
            Stream.map(sortAlbumsByArtistName),
          );
        }),
      observeGenres: () =>
        Effect.gen(function* () {
          const albumsTable = yield* database.table("albums");
          const allAlbums = yield* albumsTable.observe();

          return allAlbums.pipe(
            Stream.map((albums) => albums.flatMap((album) => album.genres)),
            Stream.map((genres) => {
              const uniqueGenres = [...new Set(genres)];
              return uniqueGenres.sort();
            }),
            Stream.catchAll(() => Stream.empty),
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

          const album = yield* toAlbumSchema(maybeAlbum.value, maybeArtist);
          return Option.some({
            ...album,
            tracks: album.tracks.sort((a, b) => a.trackNumber - b.trackNumber),
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
      search: (term) =>
        Effect.gen(function* () {
          if (term.length === 0) {
            return [[], []];
          }

          const albumsTable = yield* database.table("albums");
          const artistsTable = yield* database.table("artists");

          const matchingAlbums = yield* albumsTable.filtered({
            filter: {
              name: term,
            },
            limit: 5,
          });

          const matchingArtists = yield* artistsTable.filtered({
            filter: {
              name: term,
            },
            limit: 5,
          });

          const resolvedAlbums = yield* resolveAllAlbums(
            matchingAlbums,
            artistsTable,
          );

          const resolvedArtists = matchingArtists.map(toArtistSchema);

          return [
            sortAlbumsByArtistName(resolvedAlbums),
            sortArtistsByName(resolvedArtists),
          ];
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

  const resolvedArtist = toArtistSchema(artist.value);
  return Effect.succeed({
    ...album,
    artist: resolvedArtist,
    embeddedCover: Option.fromNullable(album.embeddedCover),
    releaseYear: Option.fromNullable(album.releaseYear),
    tracks: album.tracks.map((track) => ({
      ...track,
      mainArtist: resolvedArtist,
      secondaryArtists: [],
    })),
  });
};

const toArtistSchema = (artist: DatabaseArtist): Artist => ({
  ...artist,
  image: Option.fromNullable(artist.image),
});

const sortAlbumsByArtistName = (albums: Album[]): Album[] =>
  albums.sort((a, b) => a.artist.name.localeCompare(b.artist.name));

const sortArtistsByName = (artists: Artist[]): Artist[] =>
  artists.sort((a, b) => a.name.localeCompare(b.name));
