import type { FileMetadata } from "@echo/core-types";
import { Effect } from "effect";

enum DownloadError {
  NoBodyReturned = "no-body-returned",
  Unknown = "unknown",
}

/**
 * Partially downloads the given file from the given start to the given end
 * in bytes.
 */
export const partiallyDownloadIntoStream = (
  file: FileMetadata,
  byteRangeStart = 0,
  byteRangeEnd = 1000,
) =>
  Effect.tryPromise({
    try: () =>
      fetch(file.downloadUrl, {
        headers: {
          Range: `bytes=${byteRangeStart}-${byteRangeEnd}`,
        },
      }).then((response) => response.body), // TODO: Check if this works on Firefox.
    catch: () => DownloadError.Unknown,
  }).pipe(
    Effect.flatMap((response) => {
      if (!response) {
        return Effect.fail(DownloadError.NoBodyReturned);
      }

      return Effect.succeed(response);
    }),
  );
