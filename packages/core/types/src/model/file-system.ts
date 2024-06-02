import * as S from "@effect/schema/Schema";

/**
 * Defines a folder in a media provider's file system.
 */
export const FolderSchema = S.TaggedStruct("folder", {
  type: S.Literal("folder"),
  id: S.String.pipe(S.nonEmpty()),
  name: S.String.pipe(S.nonEmpty()),
});
export type Folder = S.Schema.Type<typeof FolderSchema>;

/**
 * Defines a file in a media provider's file system.
 */
export const FileSchema = S.TaggedStruct("file", {
  id: S.String.pipe(S.nonEmpty()),
  name: S.String.pipe(S.nonEmpty()),
  byteSize: S.Number,
  mimeType: S.optional(S.String),
  downloadUrl: S.String.pipe(S.nonEmpty()),
});
export type File = S.Schema.Type<typeof FileSchema>;

/**
 * Defines the content of a folder in a media provider's file system.
 */
export const FolderContentSchema = S.Union(FolderSchema, FileSchema);
export type FolderContent = (Folder | File)[];
