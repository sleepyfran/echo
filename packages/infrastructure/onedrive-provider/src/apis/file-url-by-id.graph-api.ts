import { Client } from "@microsoft/microsoft-graph-client";
import { FileBasedProviderError, FileId } from "@echo/core-types";
import { Effect } from "effect";
import type { DriveItem } from "@microsoft/microsoft-graph-types";

type FolderItem = Pick<DriveItem, "id"> & {
  "@microsoft.graph.downloadUrl": string;
};

/**
 * API that can be used to retrieve the URL to download a file by its ID.
 */
export type FileUrlByIdApi = (
  fileId: FileId,
) => Effect.Effect<URL, FileBasedProviderError>;

/**
 * Creates a function that retrieves the download URL of a given file by its ID.
 */
export const createFileUrlById =
  (client: Client) =>
  (fileId: FileId): Effect.Effect<URL, FileBasedProviderError> =>
    Effect.tryPromise<FolderItem, FileBasedProviderError>({
      try: () => client.api(`/me/drive/items/${fileId}`).get(),
      catch: () => FileBasedProviderError.NotFound,
    }).pipe(
      Effect.map((item) => new URL(item["@microsoft.graph.downloadUrl"])),
    );
