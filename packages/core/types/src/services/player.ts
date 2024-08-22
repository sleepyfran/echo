import { Effect, Stream } from "effect";
import type { Album, PlayerState, ProviderId } from "../model";
import type { PlayNotFoundError } from "./media-provider";

/**
 * Error that indicates that the provider of a certain track is not ready
 * to stream yet.
 */
export class ProviderNotReady extends Error {
  static readonly _tag = "ProviderNotReady";

  constructor(providerId: ProviderId) {
    super(`Provider with ID ${providerId} is not ready to stream yet.`);
  }
}

/**
 * Service that provides a way to interact with the player and its state.
 */
export type IPlayer = {
  /**
   * Plays the given album, detecting the source from each track and delegating
   * the playback to the appropriate media provider.
   */
  readonly playAlbum: (
    album: Album,
  ) => Effect.Effect<void, ProviderNotReady | PlayNotFoundError>;

  /**
   * Returns a stream that emits the current player state and any subsequent
   * changes to it.
   */
  readonly observe: Effect.Effect<Stream.Stream<PlayerState>>;
};

/**
 * Tag to identify the player service.
 */
export class Player extends Effect.Tag("@echo/core-types/Player")<
  Player,
  IPlayer
>() {}
