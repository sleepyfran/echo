import {
  type FileBasedProvider,
  type FolderMetadata,
  type FileMetadata,
  FileBasedProviderError,
  type MediaProviderBroadcastSchema,
  type ProviderMetadata,
  ProviderError,
  type BroadcastChannel,
  type MetadataProvider,
  type TrackMetadata,
  MetadataProviderError,
} from "@echo/core-types";
import { Effect, Match, Schedule, Stream } from "effect";
import { isSupportedAudioFile } from "@echo/core-files";
import {
  DownloadError,
  partiallyDownloadIntoStream,
} from "./partial-downloader";

type SyncFileBasedProviderInput = {
  metadata: ProviderMetadata;
  provider: FileBasedProvider;
  broadcastChannel: BroadcastChannel<MediaProviderBroadcastSchema["worker"]>;
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

    yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: { _tag: "syncing" },
    });

    const supportedContentStream = yield* retrieveSupportedFilesFromFolder(
      provider,
      rootFolder,
    );

    const { processed, errors } = yield* resolveMetadataFromStream(
      { metadataProvider },
      supportedContentStream,
    );

    // TODO: Save to database.

    return yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: {
        _tag: "synced",
        lastSyncedAt: new Date(),
        filesWithError: errors.length,
        syncedFiles: processed.length,
      },
    });
  }).pipe(
    Effect.catchAll(() =>
      Effect.gen(function* () {
        yield* Effect.logError(
          "Sync has failed, reporting error with API to main thread.",
        );

        // If we end up here, the provider has failed to retrieve any
        // files, since the stream is made to never fail. Report back an error.
        yield* broadcastChannel.send("reportStatus", {
          metadata,
          status: { _tag: "errored", error: ProviderError.ApiGatewayError },
        });
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

const resolveMetadataFromStream = (
  { metadataProvider }: Pick<SyncFileBasedProviderInput, "metadataProvider">,
  stream: Stream.Stream<FileMetadata>,
) =>
  stream.pipe(
    Stream.mapEffect(
      (file) =>
        partiallyDownloadFile(file).pipe(
          Effect.flatMap(([stream, file]) =>
            metadataProvider.trackMetadataFromReadableStream(stream, file),
          ),
          Effect.map((metadata) => ({ metadata, file })),
          Effect.tapError((error) =>
            Effect.logError(
              `Failed to process file ${file.name} with error: ${error}`,
            ),
          ),
          Effect.either /* We don't want to fail the whole stream in case we
                         can't process one element, instead collect both
                         successes and errors into the stream so that we can
                         report them back to the main thread */,
        ),
      { concurrency: 10 },
    ),
    Stream.runFold(
      {
        processed: [] as { metadata: TrackMetadata; file: FileMetadata }[],
        errors: [] as (DownloadError | MetadataProviderError | ProviderError)[],
      },
      (acc, currentItem) =>
        Match.value(currentItem).pipe(
          Match.tag("Left", ({ left: error }) => ({
            ...acc,
            errors: [...acc.errors, error],
          })),
          Match.tag("Right", ({ right: processedFile }) => ({
            ...acc,
            processed: [...acc.processed, processedFile],
          })),
          Match.exhaustive,
        ),
    ),
  );
