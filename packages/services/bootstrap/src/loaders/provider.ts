import { Effect, Layer } from "effect";
import {
  FileBasedProviderId,
  type ProviderMetadata,
  MediaProviderFactory,
  type Authentication,
  ApiBasedProviderId,
} from "@echo/core-types";
import { AppConfigLive } from "../app-config";
import { BrowserHttpClient } from "@effect/platform-browser";

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
): Effect.Effect<Layer.Layer<MediaProviderFactory, never, never>> => {
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
          Layer.provide(BrowserHttpClient.layerXMLHttpRequest),
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
export const LazyLoadedProviderLive = Layer.succeed(
  LazyLoadedProvider,
  LazyLoadedProvider.of({
    load: (metadata) =>
      Effect.gen(function* () {
        const providerFactory = yield* lazyLoadFromMetadata(metadata);

        return yield* Effect.provide(
          createLazyLoadedProvider(metadata),
          providerFactory,
        );
      }),
  }),
);
