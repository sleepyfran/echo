import * as S from "@effect/schema/Schema";
import { Brand } from "effect";

/**
 * A unique identifier for a folder in a media provider's file system.
 */
export type FolderId = string & Brand.Brand<"FolderId">;
export const FolderId = Brand.nominal<FolderId>();

/**
 * A unique identifier for a file in a media provider's file system.
 */
export type FileId = string & Brand.Brand<"FileId">;
export const FileId = Brand.nominal<FileId>();

/**
 * Defines a folder in a media provider's file system.
 */
export const FolderMetadata = S.TaggedStruct("folder", {
  id: S.String.pipe(S.fromBrand(FolderId)),
  name: S.NonEmptyString,
});
export type FolderMetadata = S.Schema.Type<typeof FolderMetadata>;

/**
 * Defines a file in a media provider's file system.
 */
export const FileMetadata = S.TaggedStruct("file", {
  id: S.String.pipe(S.fromBrand(FileId)),
  name: S.NonEmptyString,
  byteSize: S.Number,
  mimeType: S.Option(S.String),
  downloadUrl: S.NonEmptyString,
});
export type FileMetadata = S.Schema.Type<typeof FileMetadata>;

/**
 * Defines the content of a folder in a media provider's file system.
 */
export const FolderContentMetadata = S.Array(
  S.Union(FolderMetadata, FileMetadata),
);
export type FolderContentMetadata = S.Schema.Type<typeof FolderContentMetadata>;
