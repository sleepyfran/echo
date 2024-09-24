import { Effect, Option, Stream } from "effect";
import type { Album, AlbumId, Artist, ArtistId } from "../model";

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
 * Detail of an artist, including their albums.
 */
export type ArtistDetail = {
  readonly artist: Artist;
  readonly albums: Album[];
};

/**
 * Service that provides access to the user's library.
 */
export type ILibrary = {
  /**
   * Returns a stream of albums that are currently stored in the database.
   */
  readonly observeAlbums: () => Effect.Effect<
    Stream.Stream<Album[], NonExistingArtistReferenced>
  >;

  /**
   * Returns a stream of artists that are currently stored in the database.
   */
  readonly observeArtists: () => Effect.Effect<Stream.Stream<Artist[]>>;

  /**
   * Returns an artist by their ID, if it exists.
   */
  readonly artistDetail: (
    artistId: ArtistId,
  ) => Effect.Effect<Option.Option<ArtistDetail>, NonExistingArtistReferenced>;

  /**
   * Returns an album by its ID, if it exists.
   */
  readonly albumDetail: (
    albumId: AlbumId,
  ) => Effect.Effect<Option.Option<Album>, NonExistingArtistReferenced>;
};

/**
 * Tag to identify the library service.
 */
export class Library extends Effect.Tag("@echo/core-types/Library")<
  Library,
  ILibrary
>() {}
