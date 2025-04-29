import { Effect } from "effect";
import type { ProviderId } from "../model";
import type { ParseError } from "@effect/schema/ParseResult";

export type IMediaProviderManager = {
  /**
   * Forces the given provider to sync, even if it was synced recently. This does
   * not re-start a previous sync, but rather forces a provider that is idle to
   * start syncing.
   */
  forceSync: (providerId: ProviderId) => Effect.Effect<void, ParseError>;

  /**
   * Signs out from the given provider, stopping the syncing engine, its media
   * player, clearing its cached authentication info and removing any associated
   * data from the database.
   */
  signOut: (providerId: ProviderId) => Effect.Effect<void>;
};

/**
 * Tag to identify the MediaProviderManager service.
 */
export class MediaProviderManager extends Effect.Tag(
  "@echo/core-types/MediaProviderManager",
)<MediaProviderManager, IMediaProviderManager>() {}
