/**
 * Defines a folder in a media provider's file system.
 */
export type Folder = {
  type: "folder";
  id: string;
  name: string;
};

/**
 * Defines a file in a media provider's file system.
 */
export type File = {
  type: "file";
  id: string;
  name: string;
  byteSize: number;
  mimeType: string | undefined;
  downloadUrl: string;
};

/**
 * Defines the content of a folder in a media provider's file system.
 */
export type FolderContent = (Folder | File)[];
