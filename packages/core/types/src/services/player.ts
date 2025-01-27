import { Effect, SubscriptionRef } from "effect";
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
   * Plays the given albums, detecting the source from each track and delegating
   * the playback to the appropriate media provider, respecting the given order.
   */
  readonly playAlbums: (args: {
    albums: Album[];
    order: "newest" | "oldest" | "shuffled";
  }) => Effect.Effect<void, ProviderNotReady | PlayNotFoundError>;

  /**
   * Pauses or resumes the current track.
   */
  readonly togglePlayback: Effect.Effect<void>;

  /**
   * Skips the current track and starts playing the next one, if any.
   */
  readonly skip: Effect.Effect<void, PlayNotFoundError | ProviderNotReady>;

  /**
   * Returns to the previous track, if any.
   */
  readonly previous: Effect.Effect<void, PlayNotFoundError | ProviderNotReady>;

  /**
   * Returns a stream that emits the current player state and any subsequent
   * changes to it.
   */
  readonly observe: Effect.Effect<SubscriptionRef.SubscriptionRef<PlayerState>>;
};

/**
 * Tag to identify the player service.
 */
export class Player extends Effect.Tag("@echo/core-types/Player")<
  Player,
  IPlayer
>() {}
