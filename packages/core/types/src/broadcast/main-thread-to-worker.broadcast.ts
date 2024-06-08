import type {
  AuthenticationInfo,
  FolderMetadata,
  ProviderMetadata,
} from "../model";

type FileBasedStartInput = {
  _tag: "file-based";
  metadata: ProviderMetadata;
  authInfo: AuthenticationInfo;
  rootFolder: FolderMetadata;
};

type ApiBasedStartInput = {
  _tag: "api-based";
  metadata: ProviderMetadata;
  authInfo: AuthenticationInfo;
};

type StartInput = FileBasedStartInput | ApiBasedStartInput;

/**
 * Defines the schema for messages flowing from the main thread to the media
 * provider worker.
 */
export type MainThreadToMediaProviderBroadcastSchema = {
  /**
   * Starts the media provider with the given name authenticating the underlying
   * APIs with the given authentication information that was previously obtained
   * by the provider's auth process.
   */
  start: StartInput;

  /**
   * Stops the media provider with the given name, if it is currently running.
   * Otherwise, this action has no effect.
   */
  stop: { provider: ProviderMetadata };
};
