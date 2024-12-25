import { Effect, Option, Stream } from "effect";
import type {
  AuthenticationInfo,
  ProviderId,
  ProviderMetadata,
} from "../model";
import type { MediaPlayer, MediaProvider } from "./media-provider";
import type { Authentication } from "./authentication";

export type ProviderWithMetadata = {
  readonly lastAuthInfo: AuthenticationInfo;
  readonly metadata: ProviderMetadata;
  readonly authentication: Authentication;
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
  readonly add: (args: ProviderWithMetadata) => Effect.Effect<void>;

  /**
   * Returns a media provider, if it is currently active, or none otherwise.
   */
  readonly get: (
    providerId: ProviderId,
  ) => Effect.Effect<Option.Option<ProviderWithMetadata>>;

  /**
   * Returns all currently active media providers.
   */
  readonly getAll: Effect.Effect<ProviderWithMetadata[]>;

  /**
   * Returns a stream of all currently active media providers, emitting new
   * values whenever the cache changes.
   */
  readonly observe: Stream.Stream<ProviderWithMetadata[]>;
};

/**
 * Tag to identify the ActiveMediaProviderCache service.
 */
export class ActiveMediaProviderCache extends Effect.Tag(
  "@echo/core-types/ActiveMediaProviderCache",
)<ActiveMediaProviderCache, IActiveMediaProviderCache>() {}
