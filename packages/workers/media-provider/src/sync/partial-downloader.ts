import type { FileMetadata } from "@echo/core-types";
import { Effect } from "effect";

/**
 * Error that occurs when no body is returned during the download process.
 */
export class NoBodyReturnedError {
  readonly _tag = "no-body-returned";
}

/**
 * General, unknown error that can occur during the download process. It's probably
 * not that it's actually unknown, but that we don't want to deal with the specifics
 * of the error.
 */
export class UnknownError {
  readonly _tag = "unknown";
}

/**
 * All possible errors that can occur during the download process.
 */
export type DownloadError = NoBodyReturnedError | UnknownError;

/**
 * Partially downloads the given file from the given start to the given end
 * in bytes.
 */
export const partiallyDownloadIntoStream = (
  file: FileMetadata,
  byteRangeStart = 0,
  byteRangeEnd = 10000,
) =>
  Effect.tryPromise({
    try: () =>
      fetch(file.downloadUrl, {
        headers: {
          Range: `bytes=${byteRangeStart}-${byteRangeEnd}`,
        },
      }).then((response) => response.body), // TODO: Check if this works on Firefox.
    catch: () => new UnknownError(),
  }).pipe(
    Effect.flatMap((response) => {
      if (!response) {
        return Effect.fail(new NoBodyReturnedError());
      }

      return Effect.succeed(response);
    }),
  );
