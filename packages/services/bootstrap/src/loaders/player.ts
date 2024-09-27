import { Effect, Layer } from "effect";
import {
  type ProviderMetadata,
  MediaPlayerFactory,
  ProviderType,
} from "@echo/core-types";
import { BrowserHttpClient } from "@effect/platform-browser";

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
): Effect.Effect<Layer.Layer<MediaPlayerFactory, never, never>> => {
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
          Layer.provide(BrowserHttpClient.layerXMLHttpRequest),
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
export const LazyLoadedMediaPlayerLive = Layer.succeed(
  LazyLoadedMediaPlayer,
  LazyLoadedMediaPlayer.of({
    load: (metadata) =>
      Effect.gen(function* () {
        const mediaPlayerFactory = yield* lazyLoadFromMetadata(metadata);

        return yield* Effect.provide(
          createLazyLoadedMediaPlayer(metadata),
          mediaPlayerFactory,
        );
      }),
  }),
);
