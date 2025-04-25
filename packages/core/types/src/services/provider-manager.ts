import { Effect } from "effect";
import type { ProviderId } from "../model";

export type IMediaProviderManager = {
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
