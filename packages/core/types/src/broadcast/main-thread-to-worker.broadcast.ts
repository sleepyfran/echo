import {
  ProviderMetadataSchema,
  AuthenticationInfoSchema,
  FolderSchema,
} from "../model";
import * as S from "@effect/schema/Schema";

const FileBasedStartInputSchema = S.TaggedStruct("file-based", {
  metadata: ProviderMetadataSchema,
  authInfo: AuthenticationInfoSchema,
  rootFolder: FolderSchema,
});

const ApiBasedStartInputSchema = S.TaggedStruct("api-based", {
  metadata: ProviderMetadataSchema,
  authInfo: AuthenticationInfoSchema,
});

const StartInputSchema = S.Union(
  FileBasedStartInputSchema,
  ApiBasedStartInputSchema,
);

const StopInputSchema = S.Struct({
  provider: ProviderMetadataSchema,
});

/**
 * Defines the schema for messages flowing from the main thread to the media
 * provider worker.
 */
export const MainThreadToMediaProviderBroadcastSchema = S.Struct({
  /**
   * Starts the media provider with the given name authenticating the underlying
   * APIs with the given authentication information that was previously obtained
   * by the provider's auth process.
   */
  start: StartInputSchema,

  /**
   * Stops the media provider with the given name, if it is currently running.
   * Otherwise, this action has no effect.
   */
  stop: StopInputSchema,
});
export type MainThreadToMediaProviderBroadcast = S.Schema.Type<
  typeof MainThreadToMediaProviderBroadcastSchema
>;
