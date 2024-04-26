import type { Effect } from "effect/Effect";
import type { AuthenticationInfo, Folder, FolderContent } from "../model";
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
  readonly listRoot: Effect<FolderContent, FileBasedProviderError>;

  /**
   * Lists the given folder.
   */
  readonly listFolder: (
    folder: Folder,
  ) => Effect<FolderContent, FileBasedProviderError>;
};

/**
 * Defines all types of providers that are available in the app.
 */
export type Provider = FileBasedProvider;

/**
 * A factory that can provide an instance to the authentication provider that
 * pairs with this media provider, and can create a new instance of the media
 * provider given the authentication info.
 */
export type ProviderFactory = {
  /**
   * Returns an instance of the authentication provider that pairs with this
   * media provider.
   */
  readonly authenticationProvider: Effect<Authentication>;

  /**
   * Creates a new instance of the underlying provider.
   */
  readonly createMediaProvider: (authInfo: AuthenticationInfo) => Provider;
};

export const ProviderFactory = Context.GenericTag<ProviderFactory>(
  "@echo/core-types/ProviderFactory",
);
