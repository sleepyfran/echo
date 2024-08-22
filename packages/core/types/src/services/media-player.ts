import { Effect, Stream } from "effect";

/**
 * Current state in which the media player is in.
 */
export type MediaPlayerState =
  | { _tag: "idle" }
  | { _tag: "playing" }
  | { _tag: "paused" };

/**
 * Service that provides media playback capabilities and exposes the current
 * state of the player.
 */
type IMediaPlayer<TStreamingSource> = {
  /**
   * Starts the player with the given source.
   */
  readonly play: (fromSource: TStreamingSource) => Effect.Effect<void>;

  /**
   * Returns a stream that emits the current player state and any subsequent
   * changes to it.
   */
  readonly observe: Effect.Effect<Stream.Stream<MediaPlayerState>>;
};

/**
 * A media player that can play tracks that are hosted on a file-system.
 */
export type IFileMediaPlayer = IMediaPlayer<URL>;

/**
 * A media player that can play tracks that are hosted on a third-party API.
 */
export type IApiMediaPlayer = IMediaPlayer<never>;

/**
 * Tag to identify a file-based media player.
 */
export class FileMediaPlayer extends Effect.Tag("@echo/core-types/Library")<
  FileMediaPlayer,
  IMediaPlayer<URL>
>() {}

/**
 * Tag to identify an API-based media player.
 */
export class ApiMediaPlayer extends Effect.Tag("@echo/core-types/Library")<
  ApiMediaPlayer,
  IMediaPlayer<never>
>() {}
