import { Effect, Layer } from "effect";
import {
  type ProviderMetadata,
  MediaPlayerFactory,
  ProviderType,
} from "@echo/core-types";

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
  if (metadata.type === ProviderType.FileBased) {
    return Effect.promise(async () => {
      const { HtmlAudioMediaPlayerFactoryLive } = await import(
        "@echo/infrastructure-html-audio-media-player"
      );
      return HtmlAudioMediaPlayerFactoryLive;
    });
  }

  throw new Error(
    `No package available for media player with type: ${metadata.type}`,
  );
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
