import {
  type Album,
  Database,
  Library,
  NonExistingArtistReferenced,
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
            Stream.mapEffect((album) =>
              Effect.gen(function* () {
                const artist = yield* artistsTable.byId(album.artistId);

                if (Option.isNone(artist)) {
                  return yield* Effect.fail(
                    new NonExistingArtistReferenced(album.name, album.artistId),
                  );
                }

                return { ...album, artist: artist.value } as Album;
              }),
            ),
          );
        }),
    });
  }),
);
