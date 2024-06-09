import {
  type FileBasedProvider,
  type FolderMetadata,
  type FileMetadata,
  FileBasedProviderError,
  type MediaProviderWorkerToMainThreadBroadcastSchema,
  type ProviderMetadata,
  ProviderError,
  type BroadcastChannel,
  type MetadataProvider,
} from "@echo/core-types";
import { Effect, Match, Schedule, Stream } from "effect";
import { isSupportedAudioFile } from "@echo/core-files";
import { partiallyDownloadIntoStream } from "./partial-downloader";

type SyncFileBasedProviderInput = {
  metadata: ProviderMetadata;
  provider: FileBasedProvider;
  broadcastChannel: BroadcastChannel<MediaProviderWorkerToMainThreadBroadcastSchema>;
  metadataProvider: MetadataProvider;
  rootFolder: FolderMetadata;
};

export const syncFileBasedProvider = ({
  broadcastChannel,
  metadata,
  metadataProvider,
  provider,
  rootFolder,
}: SyncFileBasedProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting sync for provider ${metadata.id}`);

    const supportedContentStream = yield* retrieveSupportedFilesFromFolder(
      provider,
      rootFolder,
    );

    return yield* supportedContentStream.pipe(
      Stream.mapEffect(partiallyDownloadFile, { concurrency: 10 }),
      Stream.mapEffect(
        ([stream, file]) =>
          metadataProvider.trackMetadataFromReadableStream(stream, file),
        { concurrency: 10 },
      ),
      Stream.either,
      Stream.runForEach((either) =>
        Match.value(either).pipe(
          Match.tag("Left", ({ left }) =>
            Effect.logError(
              `Failed to retrieve metadata for file with error ${left}`,
            ),
          ),
          Match.tag("Right", ({ right }) =>
            Effect.log(
              `Successfully retrieve metadata for file with metadata ${right.artists} / ${right.title}`,
            ),
          ),
          Match.exhaustive,
        ),
      ),
    );
  }).pipe(
    Effect.catchAll(() =>
      broadcastChannel.send("reportStatus", {
        metadata,
        status: { _tag: "errored", error: ProviderError.ApiGatewayError },
      }),
    ),
  );

const partiallyDownloadFile = (file: FileMetadata) =>
  // TODO: Implement retry with a bigger partial range if metadata is undefined.
  partiallyDownloadIntoStream(file, 0, 10000).pipe(
    Effect.map((stream) => [stream, file] as const),
    Effect.retry({
      times: 3,
      schedule: Schedule.exponential("1 second"),
    }),
    Effect.tapError((error) =>
      Effect.logError(
        `Failed to download file ${file.name} with error: ${error}`,
      ),
    ),
  );

const retrieveSupportedFilesFromFolder = (
  provider: FileBasedProvider,
  folder: FolderMetadata,
): Effect.Effect<Stream.Stream<FileMetadata>, FileBasedProviderError> =>
  Effect.gen(function* () {
    const matcher = Match.type<FolderMetadata | FileMetadata>();

    const folderContent = yield* provider.listFolder(folder);
    return Stream.fromIterable(folderContent).pipe(
      Stream.mapEffect((item) =>
        matcher.pipe(
          Match.tag("folder", (folder) =>
            retrieveSupportedFilesFromFolder(provider, folder).pipe(
              Effect.retry({ times: 3 }),
              Effect.orElseSucceed(() => Stream.empty),
            ),
          ),
          Match.tag("file", (file) =>
            Effect.succeed(
              isSupportedAudioFile(file) ? Stream.make(file) : Stream.empty,
            ),
          ),
          Match.exhaustive,
        )(item),
      ),
      Stream.flatten({ concurrency: "unbounded" }),
    );
  });
