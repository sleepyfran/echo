import { Context, type Effect } from "effect";
import type { FileMetadata } from "../model";

/**
 * Defines the metadata extracted from a single track.
 */
export type TrackMetadata = {
  /**
   * Number of this track in the release.
   */
  trackNumber?: number | undefined;

  /**
   * Total number of tracks in the release.
   */
  totalTracks?: number | undefined;

  /**
   * Disk number that the track is on.
   */
  diskNumber?: number | undefined;

  /**
   * Total number of disks in the release.
   */
  totalDisks?: number | undefined;

  /**
   * Release year of the track (and album).
   */
  year?: number | undefined;

  /**
   * Title of the track.
   */
  title?: string | undefined;

  /**
   * Track artists, aims to capture every artist in a different string.
   */
  artists?: string[] | undefined;

  /**
   * Title of the release the track belongs to.
   */
  album?: string | undefined;

  /**
   * Genres of the track.
   */
  genre?: string[] | undefined;

  /**
   * Embedded cover art of the track as a blob.
   */
  embeddedCover?: Blob | undefined;

  /**
   * Keywords to reflect the mood of the audio, e.g. 'Romantic' or 'Sad'
   */
  mood?: string | undefined;

  /**
   * Length of the track in seconds.
   */
  lengthInSeconds?: number | undefined;
};

/**
 * Errors that can occur when parsing metadata.
 */
export enum MetadataProviderError {
  MalformedFile = "malformed-file",
}

/**
 * Provider for metadata that can analyze data from a readable stream.
 */
export type MetadataProvider = {
  /**
   * Retrieves the metadata of a track from the given readable stream.
   */
  trackMetadataFromReadableStream: (
    stream: ReadableStream,
    file: FileMetadata,
  ) => Effect.Effect<TrackMetadata, MetadataProviderError>;
};

/**
 * Tag to identify the metadata provider service.
 */
export const MetadataProvider = Context.GenericTag<MetadataProvider>(
  "@echo/core-types/MetadataProvider",
);
