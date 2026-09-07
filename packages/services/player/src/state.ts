import type { MediaPlayer, PlayerState } from "@echo/core-types";
import { Context, Option, Scope, SubscriptionRef } from "effect";

/**
 * Reference to the current state of the player.
 */
export type IPlayerStateRef = SubscriptionRef.SubscriptionRef<PlayerState>;

/**
 * Tag that can provide a ref to the current state of the player.
 */
export class PlayerStateRef extends Context.Service<
  PlayerStateRef,
  IPlayerStateRef
>()("@echo/services-player/PlayerStateRef") {}

/**
 * Contains a ref to the currently active media player and a scope to manage
 * the disposal of it.
 */
export type ICurrentlyActivePlayerRef = SubscriptionRef.SubscriptionRef<
  Option.Option<{ player: MediaPlayer; scope: Scope.Closeable }>
>;

/**
 * Tag that can provide a ref to the currently active media player, if any.
 */
export class CurrentlyActivePlayerRef extends Context.Service<
  CurrentlyActivePlayerRef,
  ICurrentlyActivePlayerRef
>()("@echo/services-player/CurrentlyActivePlayerRef") {}
