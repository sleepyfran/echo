import { Context, Effect } from "effect";
import type { Album } from "../model";

/**
 * Service that provides a way to interact with the player and its state.
 */
export type Player = {
  /**
   * Plays the given album, detecting the source from each track and delegating
   * the playback to the appropriate media provider.
   */
  readonly playAlbum: (album: Album) => Effect.Effect<void>;
};

/**
 * Tag to identify the player service.
 */
export const Player = Context.GenericTag<Player>("@echo/core-types/Player");
