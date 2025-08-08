import { MetadataProvider, MalformedFileError } from "@echo/core-types";
import { Effect, Layer, Option } from "effect";
import { Buffer } from "buffer";
import process from "process";
import { parseWebStream, type IAudioMetadata } from "music-metadata";

// Polyfills needed for `music-metadata-browser` to work.
globalThis.Buffer = Buffer;
globalThis.process = process;

/**
 * Creates a metadata provider that uses `music-metadata-browser` to extract
 * the information.
 */
const mmbMetadataProvider = MetadataProvider.of({
  /**
   * Attempts to extract metadata from the given readable stream. The provided
   * file is used to hint the mime type and size of the stream.
   */
  trackMetadataFromReadableStream: (stream, file) =>
    Effect.tryPromise({
      try: () =>
        parseWebStream(stream, {
          mimeType: Option.getOrElse(file.mimeType, () => ""),
          size: file.byteSize,
        }),
      catch: (e) => new MalformedFileError(e),
    }).pipe(
      Effect.flatMap((metadata) =>
        Effect.gen(function* () {
          const embeddedCover = yield* tryCreateBlob(metadata).pipe(
            Effect.catchAll(() =>
              Effect.logError(
                `Cover extraction failed for ${file.name}, continuing without cover`,
              ).pipe(Effect.map(() => undefined)),
            ),
          );

          return {
            album: metadata.common.album,
            artists: metadata.common.artists,
            diskNumber: metadata.common.disk.no ?? undefined,
            genre: metadata.common.genre,
            mood: metadata.common.mood,
            title: metadata.common.title,
            totalDisks: metadata.common.disk.of ?? undefined,
            totalTracks: metadata.common.track.of ?? undefined,
            trackNumber: metadata.common.track.no ?? undefined,
            embeddedCover,
            year: metadata.common.year,
            lengthInSeconds: metadata.format.duration,
          };
        }),
      ),
    ),
});

const tryCreateBlob = (parsedMetadata: IAudioMetadata) =>
  Effect.try((): Blob | undefined => {
    const firstPicture = parsedMetadata.common.picture?.find(
      (picture) => picture.data,
    );

    if (!firstPicture) {
      return undefined;
    }

    return new Blob([firstPicture.data as unknown as BlobPart], {
      type: firstPicture.format,
    });
  });

/**
 * Layer that provides a metadata provider that uses `music-metadata-browser`.
 */
export const MmbMetadataProviderLive = Layer.succeed(
  MetadataProvider,
  mmbMetadataProvider,
);
