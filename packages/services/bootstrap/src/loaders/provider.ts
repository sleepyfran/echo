import { Effect, Layer } from "effect";
import {
  FileBasedProviderId,
  type ProviderMetadata,
  MediaProviderFactory,
  type Authentication,
} from "@echo/core-types";
import { AppConfigLive } from "../app-config";

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
  if (metadata.id === FileBasedProviderId.OneDrive) {
    return Effect.promise(async () => {
      const { OneDriveProviderFactoryLive } = await import(
        "@echo/infrastructure-onedrive-provider"
      );
      return OneDriveProviderFactoryLive.pipe(Layer.provide(AppConfigLive));
    });
  }

  throw new Error(
    `No package available for provider with name: ${metadata.id}`,
  );
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
