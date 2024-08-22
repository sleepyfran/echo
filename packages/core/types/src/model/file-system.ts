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
export type FolderMetadata = {
  _tag: "folder";
  id: FolderId;
  name: string;
};

/**
 * Defines a file in a media provider's file system.
 */
export type FileMetadata = {
  _tag: "file";
  id: FileId;
  name: string;
  byteSize: number;
  mimeType: string | undefined;
  downloadUrl: string;
};

/**
 * Defines the content of a folder in a media provider's file system.
 */
export type FolderContentMetadata = (FolderMetadata | FileMetadata)[];
