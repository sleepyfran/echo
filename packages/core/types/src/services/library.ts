import { Effect, Option, Stream } from "effect";
import type {
  Album,
  AlbumId,
  AlbumWithTracks,
  Artist,
  ArtistId,
} from "../model";
import type { NonExistingArtistReferenced } from "./database";

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
  ) => Effect.Effect<
    Option.Option<AlbumWithTracks>,
    NonExistingArtistReferenced
  >;
};

/**
 * Tag to identify the library service.
 */
export class Library extends Effect.Tag("@echo/core-types/Library")<
  Library,
  ILibrary
>() {}
