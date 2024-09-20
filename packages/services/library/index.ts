import {
  Database,
  Library,
  NonExistingArtistReferenced,
  type Album,
  type AlbumInfo,
  type DatabaseAlbum,
  type DatabaseArtist,
  type DatabaseTrack,
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
      observeAlbums: () =>
        Effect.gen(function* () {
          const albumsTable = yield* database.table("albums");
          const artistsTable = yield* database.table("artists");
          const tracksTable = yield* database.table("tracks");
          const allAlbums = yield* albumsTable.observe();

          return allAlbums.pipe(
            Stream.mapEffect((albums) =>
              resolveAllAlbums(albums, artistsTable, tracksTable),
            ),
            Stream.map(sortAlbumsByArtistName),
          );
        }),
      observeArtists: () =>
        Effect.gen(function* () {
          const artistsTable = yield* database.table("artists");
          const allArtists = yield* artistsTable.observe();

          return allArtists.pipe(
            Stream.map(sortArtistsByName),
            Stream.catchAll(() => Stream.empty),
          );
        }),
    });
  }),
);

const resolveAllAlbums = (
  albums: DatabaseAlbum[],
  artistsTable: Table<"artists", DatabaseArtist>,
  tracksTable: Table<"tracks", DatabaseTrack>,
): Effect.Effect<Album[], NonExistingArtistReferenced> =>
  Effect.all(
    albums.map((album) =>
      Effect.gen(function* () {
        const artist = yield* artistsTable.byId(album.artistId);
        const tracks = yield* tracksTable.filtered({
          filter: {
            albumId: album.id,
          },
        });

        return yield* toAlbumSchema(album, artist, tracks);
      }),
    ),
    {
      concurrency: 4,
    },
  );

const toAlbumSchema = (
  album: DatabaseAlbum,
  artist: Option.Option<DatabaseArtist>,
  tracks: DatabaseTrack[],
): Effect.Effect<Album, NonExistingArtistReferenced> => {
  if (Option.isNone(artist)) {
    return Effect.fail(
      new NonExistingArtistReferenced(album.name, album.artistId),
    );
  }

  const albumInfo: AlbumInfo = {
    ...album,
    artist: artist.value,
  };

  return Effect.succeed({
    ...albumInfo,
    artist: artist.value,
    tracks: tracks
      .sort((a, b) => a.trackNumber - b.trackNumber)
      .map((track) => ({
        ...track,
        albumInfo,
        mainArtist: artist.value,
        secondaryArtists: [],
      })),
  });
};

const sortAlbumsByArtistName = (albums: Album[]): Album[] =>
  albums.sort((a, b) => a.artist.name.localeCompare(b.artist.name));

const sortArtistsByName = (artists: DatabaseArtist[]): DatabaseArtist[] =>
  artists.sort((a, b) => a.name.localeCompare(b.name));
