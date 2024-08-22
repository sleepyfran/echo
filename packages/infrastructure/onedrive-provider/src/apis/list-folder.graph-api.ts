import { Client } from "@microsoft/microsoft-graph-client";
import type { DriveItem } from "@microsoft/microsoft-graph-types";
import {
  FileBasedProviderError,
  type FolderMetadata,
  type FolderContentMetadata,
  FolderId,
  FileId,
} from "@echo/core-types";
import type { CollectionResult } from "./types.ts";
import { Effect } from "effect";

type FolderItem = Pick<
  DriveItem,
  "folder" | "file" | "name" | "id" | "size"
> & {
  "@microsoft.graph.downloadUrl": string;
};

/**
 * Creates a function that lists the files and folders inside a given folder.
 */
export const createListFolder =
  (client: Client) =>
  (
    folder: FolderMetadata,
  ): Effect.Effect<FolderContentMetadata, FileBasedProviderError> =>
    Effect.tryPromise<CollectionResult<FolderItem>, FileBasedProviderError>({
      try: () => client.api(`/me/drive/items/${folder.id}/children`).get(),
      catch: () => FileBasedProviderError.NotFound,
    }).pipe(
      Effect.flatMap((content) => Effect.succeed(content.value ?? [])),
      Effect.map((items) =>
        items.flatMap((item) => {
          if (!item.id || !item.name) {
            return [];
          }

          return item.folder
            ? {
                _tag: "folder" as const,
                id: FolderId(item.id),
                name: item.name,
              }
            : item.file && item["@microsoft.graph.downloadUrl"]
              ? {
                  _tag: "file" as const,
                  id: FileId(item.id),
                  name: item.name,
                  byteSize: item.size ?? 0,
                  mimeType: item.file.mimeType ?? undefined,
                  downloadUrl: item["@microsoft.graph.downloadUrl"],
                }
              : [];
        }),
      ),
    );
