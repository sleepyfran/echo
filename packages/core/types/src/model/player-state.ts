import { Data } from "effect";
import type { Album } from "./album";

/**
 * Defines whether the player is playing, paused or stopped.
 */
export type PlayingStatus =
  | { _tag: "Playing"; album: Album; trackIndex: number }
  | { _tag: "Paused"; album: Album; trackIndex: number }
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
   * Whether there's anything to play after the current track.
   */
  allowsNext: boolean;

  /**
   * Whether there's anything to play before the current track.
   */
  allowsPrevious: boolean;

  /**
   * List of tracks that have been played before the current track.
   */
  previouslyPlayedAlbums: Album[];

  /**
   * List of tracks that will be played after the current track.
   */
  comingUpAlbums: Album[];
};
