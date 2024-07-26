import type { Option } from "effect";
import type { Track } from "./track";

/**
 * Defines whether the player is playing, paused or stopped.
 */
export type PlayingStatus = "playing" | "paused" | "stopped";

/**
 * Represents the current state of the player.
 */
export type PlayerState = {
  /**
   * Whether the player is playing, paused or stopped.
   */
  status: PlayingStatus;

  /**
   * Current track that is being played, if any.
   */
  currentTrack: Option.Option<Track>;

  /**
   * List of tracks that have been played before the current track.
   */
  previouslyPlayedTracks: Track[];

  /**
   * List of tracks that will be played after the current track.
   */
  comingUpTracks: Track[];
};
