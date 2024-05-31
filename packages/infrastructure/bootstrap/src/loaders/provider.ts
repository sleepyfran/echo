import type { ProviderMetadata } from "@echo/core-types";
import { Effect, Layer } from "effect";
import { ProviderId, type AppConfig, ProviderFactory } from "@echo/core-types";

/**
 * Lazy loads a media provider based on the metadata provided.
 */
const lazyLoadFromMetadata = (
  metadata: ProviderMetadata,
): Effect.Effect<Layer.Layer<ProviderFactory, never, AppConfig>> => {
  if (metadata.id === ProviderId.OneDrive) {
    return Effect.promise(async () => {
      const { OneDriveProviderFactoryLive } = await import(
        "@echo/infrastructure-onedrive-provider"
      );
      return OneDriveProviderFactoryLive;
    });
  }

  throw new Error(
    `No package available for provider with name: ${metadata.id}`,
  );
};

/**
 * Lazy loads a provider by the given metadata.
 * @param metadata The metadata of the provider to load.
 * @param appConfigLayer Layer that can provide the app config.
 * @returns An effect that can provide a factory for the provider.
 */
export const lazyLoadProviderFromMetadata = (
  metadata: ProviderMetadata,
  appConfigLayer: Layer.Layer<AppConfig, never>,
) =>
  Effect.gen(function* () {
    const providerFactory = yield* lazyLoadFromMetadata(metadata);
    const providerFactoryLive = providerFactory.pipe(
      Layer.provide(appConfigLayer),
    );

    return yield* Effect.provide(
      Effect.gen(function* () {
        const providerFactory = yield* ProviderFactory;
        const authentication = yield* providerFactory.authenticationProvider;

        return {
          metadata,
          authentication,
          createMediaProvider: providerFactory.createMediaProvider,
        };
      }),
      providerFactoryLive,
    );
  });
