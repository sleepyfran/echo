import {
  FileId,
  MalformedFileError,
  MetadataProvider,
  type FileMetadata,
} from "@echo/core-types";
import { Effect, Option } from "effect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { resolveFileMetadata } from "./file-based-sync";

describe("resolveFileMetadata", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("retries with the entire file when partial metadata extraction fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >((_input, _init) => Promise.resolve(new Response("audio data")));
    vi.stubGlobal("fetch", fetchMock);

    let extractionAttempts = 0;
    const metadataProvider = MetadataProvider.of({
      trackMetadataFromReadableStream: () => {
        extractionAttempts += 1;

        return extractionAttempts === 1
          ? Effect.fail(new MalformedFileError("incomplete file"))
          : Effect.succeed({ title: "Track title" });
      },
    });
    const file: FileMetadata = {
      _tag: "file",
      id: FileId("file-id"),
      name: "track.mp3",
      byteSize: 1_000_000,
      mimeType: Option.some("audio/mpeg"),
      downloadUrl: "https://example.com/track.mp3",
    };

    const metadata = await Effect.runPromise(
      resolveFileMetadata(metadataProvider, file),
    );

    expect(metadata).toEqual({ title: "Track title" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      headers: { Range: "bytes=0-500000" },
    });
    expect(fetchMock.mock.calls[1]?.[1]).toBeUndefined();
  });

  test("retries with the entire file when partial metadata has no cover", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >((_input, _init) => Promise.resolve(new Response("audio data")));
    vi.stubGlobal("fetch", fetchMock);

    const embeddedCover = new Blob(["cover"]);
    let extractionAttempts = 0;
    const metadataProvider = MetadataProvider.of({
      trackMetadataFromReadableStream: () => {
        extractionAttempts += 1;

        return Effect.succeed(
          extractionAttempts === 1
            ? { title: "Track title" }
            : { title: "Track title", embeddedCover },
        );
      },
    });
    const file: FileMetadata = {
      _tag: "file",
      id: FileId("file-id"),
      name: "track.flac",
      byteSize: 1_000_000,
      mimeType: Option.some("audio/flac"),
      downloadUrl: "https://example.com/track.flac",
    };

    const metadata = await Effect.runPromise(
      resolveFileMetadata(metadataProvider, file),
    );

    expect(metadata).toEqual({ title: "Track title", embeddedCover });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      headers: { Range: "bytes=0-500000" },
    });
    expect(fetchMock.mock.calls[1]?.[1]).toBeUndefined();
  });
});
