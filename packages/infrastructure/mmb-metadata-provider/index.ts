import { MetadataProviderError, MetadataProvider } from "@echo/core-types";
import { Effect, Layer } from "effect";
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
          mimeType: file.mimeType ?? "",
          size: file.byteSize,
        }),
      catch: () => MetadataProviderError.MalformedFile,
    }).pipe(
      Effect.flatMap((metadata) =>
        Effect.gen(function* () {
          const base64EmbeddedCover = yield* tryExtractToBase64(metadata).pipe(
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
            base64EmbeddedCover,
            year: metadata.common.year,
          };
        }),
      ),
    ),
});

const tryExtractToBase64 = (parsedMetadata: IAudioMetadata) =>
  Effect.try(() => {
    const firstPicture = parsedMetadata.common.picture?.find(
      (picture) => picture.data,
    );

    if (!firstPicture) {
      return undefined;
    }

    const pictureData = new Uint8Array(firstPicture.data as ArrayBufferLike);
    return Buffer.from(pictureData).toString("base64");
  });

/**
 * Layer that provides a metadata provider that uses `music-metadata-browser`.
 */
export const MmbMetadataProviderLive = Layer.succeed(
  MetadataProvider,
  mmbMetadataProvider,
);
