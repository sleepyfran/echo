import type { MediaPlayer, PlayerState } from "@echo/core-types";
import { Context, Option, Scope, SubscriptionRef } from "effect";

/**
 * Reference to the current state of the player.
 */
export type IPlayerStateRef = SubscriptionRef.SubscriptionRef<PlayerState>;

/**
 * Tag that can provide a ref to the current state of the player.
 */
export class PlayerStateRef extends Context.Tag(
  "@echo/services-player/PlayerStateRef",
)<PlayerStateRef, IPlayerStateRef>() {}

/**
 * Contains a ref to the currently active media player and a scope to manage
 * the disposal of it.
 */
export type ICurrentlyActivePlayerRef = SubscriptionRef.SubscriptionRef<
  Option.Option<{ player: MediaPlayer; scope: Scope.CloseableScope }>
>;

/**
 * Tag that can provide a ref to the currently active media player, if any.
 */
export class CurrentlyActivePlayerRef extends Context.Tag(
  "@echo/services-player/CurrentlyActivePlayerRef",
)<CurrentlyActivePlayerRef, ICurrentlyActivePlayerRef>() {}
