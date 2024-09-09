import type { MediaPlayer, PlayerState } from "@echo/core-types";
import { Context, Option, SubscriptionRef } from "effect";

export type IPlayerStateRef = SubscriptionRef.SubscriptionRef<PlayerState>;

/**
 * Tag that can provide a ref to the current state of the player.
 */
export class PlayerStateRef extends Context.Tag(
  "@echo/services-player/PlayerStateRef",
)<PlayerStateRef, IPlayerStateRef>() {}

export type ICurrentlyActivePlayerRef = SubscriptionRef.SubscriptionRef<
  Option.Option<MediaPlayer>
>;

/**
 * Tag that can provide a ref to the currently active media player, if any.
 */
export class CurrentlyActivePlayerRef extends Context.Tag(
  "@echo/services-player/CurrentlyActivePlayerRef",
)<CurrentlyActivePlayerRef, ICurrentlyActivePlayerRef>() {}
