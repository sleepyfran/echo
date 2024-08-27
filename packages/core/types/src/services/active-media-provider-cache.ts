import { Effect, Option } from "effect";
import type { ProviderId, ProviderMetadata } from "../model";
import type { MediaPlayer, MediaProvider } from "./media-provider";

type ProviderWithMetadata = {
  readonly metadata: ProviderMetadata;
  readonly provider: MediaProvider;
  readonly player: MediaPlayer;
};

/**
 * Defines a cache of all currently active providers.
 */
export type MediaProviderById = Map<ProviderId, ProviderWithMetadata>;

/**
 * Service that allows to cache active media providers and observe changes to
 * them.
 */
export type IActiveMediaProviderCache = {
  /**
   * Adds the given provider to the cache. If a provider with the same ID is
   * already present, it will be replaced. Upon being added, the service will
   * listen to the provider's state changes and remove it from the cache once
   * it becomes inactive.
   */
  readonly add: (
    metadata: ProviderMetadata,
    provider: MediaProvider,
    player: MediaPlayer,
  ) => Effect.Effect<void>;

  /**
   * Returns a media provider, if it is currently active, or none otherwise.
   */
  readonly get: (providerId: ProviderId) => Effect.Effect<
    Option.Option<{
      provider: MediaProvider;
      player: MediaPlayer;
    }>
  >;

  /**
   * Returns all currently active media providers.
   */
  readonly getAll: Effect.Effect<
    {
      metadata: ProviderMetadata;
      provider: MediaProvider;
      player: MediaPlayer;
    }[]
  >;
};

/**
 * Tag to identify the ActiveMediaProviderCache service.
 */
export class ActiveMediaProviderCache extends Effect.Tag(
  "@echo/core-types/ActiveMediaProviderCache",
)<ActiveMediaProviderCache, IActiveMediaProviderCache>() {}
