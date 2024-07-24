import type { Album, Artist, Track } from "../../model";

/**
 * Represents an album in the database, which is synced with the model but
 * references other tables by their IDs instead of duplicating the data.
 */
export type DatabaseAlbum = Omit<Album, "artist"> & { artistId: Artist["id"] };

/**
 * Represents an artist in the database, which is synced with the model.
 */
export type DatabaseArtist = Artist;

/**
 * Represents a track in the database, which is synced with the model but
 * references other tables by their IDs instead of duplicating the data.
 */
export type DatabaseTrack = Omit<
  Track,
  "mainArtist" | "secondaryArtists" | "album"
> & {
  mainArtistId: Artist["id"];
  secondaryArtistIds: Artist["id"][];
  albumId: Album["id"];
};
