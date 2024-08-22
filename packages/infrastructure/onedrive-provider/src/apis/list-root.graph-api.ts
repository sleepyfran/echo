import { Client } from "@microsoft/microsoft-graph-client";
import type { DriveItem } from "@microsoft/microsoft-graph-types";
import {
  FileBasedProviderError,
  FolderId,
  type FolderMetadata,
} from "@echo/core-types";
import type { CollectionResult } from "./types.ts";
import { Effect } from "effect";

type RootItem = Pick<DriveItem, "folder" | "name" | "id">;

/**
 * Creates a function that lists the root folders in the user's OneDrive.
 */
export const createListRoot = (
  client: Client,
): Effect.Effect<FolderMetadata[], FileBasedProviderError> =>
  Effect.tryPromise<CollectionResult<RootItem>, FileBasedProviderError>({
    try: () =>
      client
        .api("/me/drive/root/children")
        .select(["folder", "name", "id"])
        .get(),
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
          : [];
      }),
    ),
  );
