import { Effect, Layer } from "effect";
import {
  type ProviderMetadata,
  MediaPlayerFactory,
  ProviderType,
  AuthenticationCache,
} from "@echo/core-types";
import { FetchHttpClient } from "@effect/platform";

/**
 * Service that can lazily load a media player.
 */
export type ILazyLoadedMediaPlayer = {
  readonly load: (metadata: ProviderMetadata) => Effect.Effect<{
    createMediaPlayer: MediaPlayerFactory["createMediaPlayer"];
  }>;
};

/**
 * Tag to identify the lazy loaded player service.
 */
export class LazyLoadedMediaPlayer extends Effect.Tag(
  "@echo/services-bootstrap/LazyLoadedMediaPlayer",
)<LazyLoadedMediaPlayer, ILazyLoadedMediaPlayer>() {}

/**
 * Lazy loads a media player based on the given metadata.
 */
const lazyLoadFromMetadata = (
  metadata: ProviderMetadata,
): Effect.Effect<
  Layer.Layer<MediaPlayerFactory, never, AuthenticationCache>
> => {
  switch (metadata.type) {
    case ProviderType.FileBased:
      return Effect.promise(async () => {
        const { HtmlAudioMediaPlayerFactoryLive } = await import(
          "@echo/infrastructure-html-audio-media-player"
        );
        return HtmlAudioMediaPlayerFactoryLive;
      });
    case ProviderType.ApiBased:
      return Effect.promise(async () => {
        const { SpotifyMediaPlayerFactoryLive } = await import(
          "@echo/infrastructure-spotify-player"
        );
        return SpotifyMediaPlayerFactoryLive.pipe(
          Layer.provide(FetchHttpClient.layer),
        );
      });
  }
};

const createLazyLoadedMediaPlayer = (metadata: ProviderMetadata) =>
  Effect.gen(function* () {
    const providerFactory = yield* MediaPlayerFactory;

    return {
      metadata,
      createMediaPlayer: providerFactory.createMediaPlayer,
    };
  });

/**
 * A layer that can lazily load a media player based on the metadata provided.
 */
export const LazyLoadedMediaPlayerLive = Layer.effect(
  LazyLoadedMediaPlayer,
  Effect.gen(function* () {
    const authCache = yield* AuthenticationCache;
    const authCacheLayer = Layer.succeed(AuthenticationCache, authCache);

    return LazyLoadedMediaPlayer.of({
      load: (metadata) =>
        Effect.gen(function* () {
          const mediaPlayerFactory = yield* lazyLoadFromMetadata(metadata);

          return yield* Effect.provide(
            createLazyLoadedMediaPlayer(metadata),
            // The auth cache requires a single instance for the whole application
            // since the tokens are only stored in-memory, but since providers
            // are lazy loaded and require the dependencies in place, we need
            // to manually provide it from the environment.
            mediaPlayerFactory.pipe(Layer.provide(authCacheLayer)),
          );
        }),
    });
  }),
);
