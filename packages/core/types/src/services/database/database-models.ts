import type { Album, Artist, Track } from "../../model";

/**
 * Represents an album in the database, which is synced with the model but
 * references other tables by their IDs instead of duplicating the data.
 */
export type DatabaseAlbum = Omit<
  Album,
  "artist" | "tracks" | "embeddedCover" | "releaseYear"
> & {
  artistId: Artist["id"];
  embeddedCover: Blob | null;
  releaseYear: number | null;
};

/**
 * Represents an artist in the database, which is synced with the model.
 */
export type DatabaseArtist = Omit<Artist, "image"> & {
  image: Blob | null;
};

/**
 * Represents a track in the database, which is synced with the model but
 * references other tables by their IDs instead of duplicating the data.
 */
export type DatabaseTrack = Omit<
  Track,
  "mainArtist" | "secondaryArtists" | "albumInfo"
> & {
  mainArtistId: Artist["id"];
  secondaryArtistIds: Artist["id"][];
  albumId: Album["id"];
};
