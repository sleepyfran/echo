import * as S from "@effect/schema/Schema";
import { GenericId } from "./common";
import { ArtistId } from "./artist";

/**
 * Wrapper around a string to represent a track id.
 */
export const TrackId = S.Union(S.String.pipe(S.startsWith("spo:")), GenericId);
export type TrackId = S.Schema.Type<typeof TrackId>;

/**
 * Represents a playable track in the user's library.
 */
export const Track = S.Struct({
  /**
   * Unique identifier for the track, either provided by a third-party (when
   * syncing against API-based services) or generated by the application. If the
   * ID is from a third-party, the first three characters of the service name
   * followed by a colon are prepended to the ID. Example: `spo:id` for an ID
   * generated by the Spotify API.
   */
  id: TrackId,

  /**
   * Link to the ID of the artist that created the track.
   */
  mainArtistId: ArtistId,

  /**
   * List of IDs of artists that contributed to the track but are not the main
   * artist. This can include featured artists, producers, and other contributors.
   * The main artist is not included in this list.
   */
  secondaryArtistIds: S.Array(ArtistId),

  /**
   * Name of the track.
   */
  name: S.String.pipe(S.nonEmpty()),

  /**
   * Number of the track inside of the album it belongs to. This is used to
   * determine the order of tracks in an album. It must be greater than zero.
   */
  trackNumber: S.Int.pipe(S.greaterThan(0)),

  /**
   * Duration of the track in milliseconds. It must be greater than zero.
   */
  durationInMilliseconds: S.Int.pipe(S.greaterThan(0)),
});
export type Track = S.Schema.Type<typeof Track>;