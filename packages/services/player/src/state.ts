import type { PlayerState } from "@echo/core-types";
import { Context, SubscriptionRef } from "effect";

/**
 * Tag that can provide a ref to the current state of the player.
 */
export class PlayerStateRef extends Context.Tag(
  "@echo/services-player/PlayerStateRef",
)<PlayerStateRef, SubscriptionRef.SubscriptionRef<PlayerState>>() {}
