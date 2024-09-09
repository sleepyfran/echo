import type { Effect } from "effect/Effect";
import type {
  AuthenticationInfo,
  FolderMetadata,
  FolderContentMetadata,
  FileId,
} from "../model";
import type { Authentication } from "./authentication";
import { Brand, Context, Stream } from "effect";

export enum FileBasedProviderError {
  NotFound = "not-found",
}

/**
 * Error raised when a file or item that was asked to be played was not found.
 */
export class PlayNotFoundError extends Error {
  static readonly _tag = "PlayError";

  constructor() {
    super();
  }
}

/**
 * A provider that provides its data via a file system. For example, OneDrive.
 */
export type FileBasedProvider = {
  /**
   * Lists the root folder of the provider.
   */
  readonly listRoot: Effect<FolderMetadata[], FileBasedProviderError>;

  /**
   * Lists the given folder.
   */
  readonly listFolder: (
    folder: FolderMetadata,
  ) => Effect<FolderContentMetadata, FileBasedProviderError>;

  /**
   * Retrieves the URL to access a file given its ID.
   */
  readonly fileUrlById: (fileId: FileId) => Effect<URL, FileBasedProviderError>;
};

/**
 * Defines all types of providers that are available in the app.
 */
export type MediaProvider = FileBasedProvider;

/**
 * A media player that can play files from a file-based provider.
 */
export type FileBasedMediaPlayer = {
  /**
   * Attempts to stream the given file via a file-based media player.
   */
  readonly playFile: (file: URL) => Effect<void, PlayNotFoundError>;
};

/**
 * Wrapper around a string to represent a media player ID.
 */
export type MediaPlayerId = string & Brand.Brand<"MediaPlayerId">;
export const MediaPlayerId = Brand.nominal<MediaPlayerId>();

/**
 * Events that can be emitted by a media player.
 */
export type MediaPlayerEvent = "trackPlaying" | "trackPaused" | "trackEnded";

/**
 * Defines all types of media players that are available in the app.
 */
export type MediaPlayer = FileBasedMediaPlayer & {
  /**
   * The ID of the media player.
   */
  readonly id: MediaPlayerId;

  /**
   * Returns a stream that emits events from the media player.
   */
  readonly observe: Stream.Stream<MediaPlayerEvent>;

  /**
   * Disposes of the media player.
   */
  readonly dispose: Effect<void>;
};

/**
 * A factory that can create a new instance of the media player.
 */
export type MediaPlayerFactory = {
  /**
   * Creates a new instance of the media player based on the given authentication
   * info.
   */
  readonly createMediaPlayer: (
    authInfo: AuthenticationInfo,
  ) => Effect<MediaPlayer>;
};

/**
 * A factory that can provide an instance to the authentication provider that
 * pairs with this media provider, and can create a new instance of the media
 * provider given the authentication info.
 */
export type MediaProviderFactory = {
  /**
   * Returns an instance of the authentication provider that pairs with this
   * media provider.
   */
  readonly authenticationProvider: Effect<Authentication>;

  /**
   * Creates a new instance of the underlying provider.
   */
  readonly createMediaProvider: (authInfo: AuthenticationInfo) => MediaProvider;
};

export const MediaProviderFactory = Context.GenericTag<MediaProviderFactory>(
  "@echo/core-types/ProviderFactory",
);

export const MediaPlayerFactory = Context.GenericTag<MediaPlayerFactory>(
  "@echo/core-types/MediaPlayerFactory",
);
