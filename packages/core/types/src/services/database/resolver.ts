import { Context, type Effect } from "effect";
import type { Album, Artist, ArtistId } from "../../model";
import type { DatabaseAlbum, DatabaseArtist } from "./database-models";

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
 * Service that can resolve database entities into their full model counterparts.
 */
export type EntityResolver = {
  /**
   * Resolves an album ID into the full album information, which includes
   * the full information about the artists.
   */
  readonly album: (
    album: DatabaseAlbum,
  ) => Effect.Effect<Album, NonExistingArtistReferenced>;

  /**
   * Resolves an artist ID into the full artist information.
   */
  readonly artist: (artist: DatabaseArtist) => Effect.Effect<Artist>;
};

/**
 * Tag to identify the resolver service.
 */
export const EntityResolver = Context.GenericTag<EntityResolver>(
  "@echo/core-types/EntityResolver",
);
