import {
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
          const tracksTable = yield* database.table("tracks");
          const allAlbums = yield* albumsTable.observe();

          return allAlbums.pipe(
            Stream.mapEffect((albums) =>
              Effect.all(
                albums.map((album) =>
                  Effect.gen(function* () {
                    const artist = yield* artistsTable.byId(album.artistId);
                    const tracks = yield* tracksTable.filtered({
                      filter: {
                        albumId: album.id,
                      },
                    });

                    if (Option.isNone(artist)) {
                      return yield* Effect.fail(
                        new NonExistingArtistReferenced(
                          album.name,
                          album.artistId,
                        ),
                      );
                    }

                    return {
                      ...album,
                      artist: artist.value,
                      tracks: tracks
                        .sort((a, b) => a.trackNumber - b.trackNumber)
                        .map((track) => ({
                          ...track,
                          albumId: album.id,
                          mainArtist: artist.value,
                          secondaryArtists: [],
                        })),
                    };
                  }),
                ),
              ),
            ),
          );
        }),
    });
  }),
);
