import { Data } from "effect";
import type { Track } from "./track";

/**
 * Defines whether the player is playing, paused or stopped.
 */
export type PlayingStatus =
  | { _tag: "Playing"; track: Track }
  | { _tag: "Paused"; track: Track }
  | { _tag: "Stopped" };

export const { Playing, Paused, Stopped } = Data.taggedEnum<PlayingStatus>();

/**
 * Represents the current state of the player.
 */
export type PlayerState = {
  /**
   * Whether the player is playing, paused or stopped, and the current track.
   */
  status: PlayingStatus;

  /**
   * List of tracks that have been played before the current track.
   */
  previouslyPlayedTracks: Track[];

  /**
   * List of tracks that will be played after the current track.
   */
  comingUpTracks: Track[];
};
