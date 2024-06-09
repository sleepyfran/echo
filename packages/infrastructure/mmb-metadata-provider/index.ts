import {
  MetadataProviderError,
  MetadataProvider,
  type TrackMetadata,
} from "@echo/core-types";
import { Effect } from "effect";
import { Buffer } from "buffer";
import process from "process";
import { parseReadableStream } from "music-metadata-browser";

// Polyfills needed for `music-metadata-browser` to work.
globalThis.Buffer = Buffer;
globalThis.process = process;

/**
 * Creates a metadata provider that uses `music-metadata-browser` to extract
 * the information.
 */
export const mmbMetadataProvider = MetadataProvider.of({
  /**
   * Attempts to extract metadata from the given readable stream. The provided
   * file is used to hint the mime type and size of the stream.
   */
  trackMetadataFromReadableStream: (stream, file) =>
    Effect.tryPromise({
      try: () =>
        parseReadableStream(stream, {
          mimeType: file.mimeType ?? "",
          size: file.byteSize,
        }),
      catch: () => MetadataProviderError.MalformedFile,
    }).pipe(
      Effect.map(
        (metadata): TrackMetadata => ({
          album: metadata.common.album,
          artists: metadata.common.artists,
          diskNumber: metadata.common.disk.no ?? undefined,
          genre: metadata.common.genre,
          mood: metadata.common.mood,
          title: metadata.common.title,
          totalDisks: metadata.common.disk.of ?? undefined,
          totalTracks: metadata.common.track.of ?? undefined,
          trackNumber: metadata.common.track.no ?? undefined,
          year: metadata.common.year,
        }),
      ),
    ),
});