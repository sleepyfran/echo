import { Brand, Option } from "effect";

/**
 * Wrapper around a string to represent an artist id.
 */
export type ArtistId = string & Brand.Brand<"ArtistId">;
export const ArtistId = Brand.nominal<ArtistId>();

/**
 * Represents an artist in the user's library.
 */
export type Artist = {
  /**
   * Unique identifier for the artist, either provided by a third-party (when
   * syncing against API-based services) or generated by the application. If the
   * ID is from a third-party, the first three characters of the service name
   * followed by a colon are prepended to the ID. Example: `spo:id` for an ID
   * generated by the Spotify API.
   */
  id: ArtistId;

  /**
   * Name of the artist.
   */
  name: string;

  /**
   * Blob containing the artist's image.
   */
  image: Option.Option<Blob>;
};
