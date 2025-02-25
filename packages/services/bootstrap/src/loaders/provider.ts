import { Effect, Layer } from "effect";
import {
  FileBasedProviderId,
  type ProviderMetadata,
  MediaProviderFactory,
  type Authentication,
  ApiBasedProviderId,
  AuthenticationCache,
} from "@echo/core-types";
import { AppConfigLive } from "../app-config";
import { FetchHttpClient } from "@effect/platform";

/**
 * Represents the available data for a loaded provider.
 */
export type ILoadedProvider = {
  metadata: ProviderMetadata;
  authentication: Authentication;
  createMediaProvider: MediaProviderFactory["createMediaProvider"];
};

/**
 * Service that can lazily load a media provider.
 */
export type ILazyLoadedProvider = {
  readonly load: (metadata: ProviderMetadata) => Effect.Effect<ILoadedProvider>;
};

/**
 * Tag to identify the lazy loaded provider service.
 */
export class LazyLoadedProvider extends Effect.Tag(
  "@echo/services-bootstrap/LazyLoadedProvider",
)<LazyLoadedProvider, ILazyLoadedProvider>() {}

/**
 * Lazy loads a media provider based on the metadata provided.
 */
const lazyLoadFromMetadata = (
  metadata: ProviderMetadata,
): Effect.Effect<
  Layer.Layer<MediaProviderFactory, never, AuthenticationCache>
> => {
  switch (metadata.id) {
    case FileBasedProviderId.OneDrive:
      return Effect.promise(async () => {
        const { OneDriveProviderFactoryLive } = await import(
          "@echo/infrastructure-onedrive-provider"
        );
        return OneDriveProviderFactoryLive.pipe(Layer.provide(AppConfigLive));
      });
    case ApiBasedProviderId.Spotify:
      return Effect.promise(async () => {
        const { SpotifyProviderFactoryLive } = await import(
          "@echo/infrastructure-spotify-provider"
        );
        return SpotifyProviderFactoryLive.pipe(
          Layer.provide(AppConfigLive),
          Layer.provide(FetchHttpClient.layer),
        );
      });
  }
};

const createLazyLoadedProvider = (metadata: ProviderMetadata) =>
  Effect.gen(function* () {
    const providerFactory = yield* MediaProviderFactory;
    const authentication = yield* providerFactory.authenticationProvider;

    return {
      metadata,
      authentication,
      createMediaProvider: providerFactory.createMediaProvider,
    };
  });

/**
 * A layer that can lazily load a media provider based on the metadata provided.
 */
export const LazyLoadedProviderLive = Layer.effect(
  LazyLoadedProvider,
  Effect.gen(function* () {
    const authCache = yield* AuthenticationCache;
    const authCacheLayer = Layer.succeed(AuthenticationCache, authCache);

    return LazyLoadedProvider.of({
      load: (metadata) =>
        Effect.gen(function* () {
          const providerFactory = yield* lazyLoadFromMetadata(metadata);

          return yield* Effect.provide(
            createLazyLoadedProvider(metadata),
            // The auth cache requires a single instance for the whole application
            // since the tokens are only stored in-memory, but since providers
            // are lazy loaded and require the dependencies in place, we need
            // to manually provide it from the environment.
            providerFactory.pipe(Layer.provide(authCacheLayer)),
          );
        }),
    });
  }),
);
