import { GenericId } from "./common";
import type {
  ApiBasedProviderId,
  FileBasedProviderId,
} from "./provider-metadata";
import { TrackId } from "./track";

/**
 * Represents how a resource can be consumed.
 */
export type StreamingResource =
  | { type: "file"; provider: FileBasedProviderId; uri: string }
  | { type: "api"; provider: ApiBasedProviderId };

/**
 * Represents the source of a track.
 */
export type StreamingSource = {
  /**
   * Unique identifier for the streaming source.
   */
  id: GenericId;

  /**
   * Unique identifier for the track that this source references.
   */
  trackId: TrackId;

  /**
   * Resource that the streaming source points to, with details on how to
   * consume and from which platform.
   */
  resource: StreamingResource;
};
