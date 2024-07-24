import { Context, Effect, Stream } from "effect";
import type { Album, ArtistId } from "../model";

/**
 * Error that is thrown when an album references an artist that does not exist.
 */
export class NonExistingArtistReferenced extends Error {
  constructor(albumName: string, artistId: ArtistId) {
    super(
      `The artist with ID "${artistId}" referenced by the album "${albumName}" does not exist`,
    );
  }
}

/**
 * Service that provides access to the user's library.
 */
export type Library = {
  /**
   * Returns a stream of albums that are currently stored in the database.
   */
  readonly observeAlbums: () => Effect.Effect<
    Stream.Stream<Album, NonExistingArtistReferenced>
  >;
};

/**
 * Tag to identify the library service.
 */
export const Library = Context.GenericTag<Library>("@echo/core-types/Library");
