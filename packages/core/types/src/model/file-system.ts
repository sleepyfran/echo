/**
 * Defines a folder in a media provider's file system.
 */
export type FolderMetadata = {
  _tag: "folder";
  id: string;
  name: string;
};

/**
 * Defines a file in a media provider's file system.
 */
export type FileMetadata = {
  _tag: "file";
  id: string;
  name: string;
  byteSize: number;
  mimeType: string | undefined;
  downloadUrl: string;
};

/**
 * Defines the content of a folder in a media provider's file system.
 */
export type FolderContentMetadata = (FolderMetadata | FileMetadata)[];
