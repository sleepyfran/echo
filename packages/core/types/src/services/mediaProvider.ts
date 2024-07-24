import type { Effect } from "effect/Effect";
import type {
  AuthenticationInfo,
  FolderMetadata,
  FolderContentMetadata,
} from "../model";
import type { Authentication } from "./authentication";
import { Context } from "effect";

export enum FileBasedProviderError {
  NotFound = "not-found",
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
};

/**
 * Defines all types of providers that are available in the app.
 */
export type MediaProvider = FileBasedProvider;

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
