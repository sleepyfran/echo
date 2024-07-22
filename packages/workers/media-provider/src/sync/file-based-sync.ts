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
  type Crypto,
  MetadataProviderError,
  type Database,
  Artist,
  Track,
  Album,
} from "@echo/core-types";
import { Effect, Match, Option, Schedule, Stream } from "effect";
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
  database: Database;
  crypto: Crypto;
  rootFolder: FolderMetadata;
};

export const syncFileBasedProvider = ({
  broadcastChannel,
  metadata,
  metadataProvider,
  provider,
  rootFolder,
  database,
  crypto,
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

    const normalizedData = yield* normalizeData(
      { database, crypto },
      processed,
    );

    yield* saveToDatabase({ database }, normalizedData);

    return yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: {
        _tag: "synced",
        lastSyncedAt: new Date(),
        filesWithError: errors.length,
        syncedFiles: normalizedData.tracks.length,
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

/**
 * Normalizes the data retrieved from the metadata to make sure that we don't
 * add multiple artists with the same name and that we won't have any tracks
 * without an artist.
 * @returns An object with all the unique artists and tracks that were retrieved.
 */
const normalizeData = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  successes: { metadata: TrackMetadata; file: FileMetadata }[],
) =>
  Stream.fromIterable(successes).pipe(
    Stream.runFoldEffect(
      { albums: [] as Album[], artists: [] as Artist[], tracks: [] as Track[] },
      (accumulator, { metadata }) =>
        Effect.gen(function* () {
          const mainArtistName = metadata.artists?.[0] ?? "Unknown Artist";
          const artist = yield* tryRetrieveOrCreateArtist(
            { database, crypto },
            mainArtistName,
          );

          const album = yield* tryRetrieveOrCreateAlbum(
            { database, crypto },
            artist.id,
            metadata.album ?? "Unknown Album",
          );

          // TODO: Save the file! Otherwise, this is useless.
          const track = yield* tryRetrieveOrCreateTrack(
            { crypto, database },
            artist.id,
            album.id,
            metadata,
          );

          return {
            albums: [...accumulator.albums, album],
            artists: [...accumulator.artists, artist],
            tracks: [...accumulator.tracks, track],
          };
        }),
    ),
  );

const saveToDatabase = (
  { database }: Pick<SyncFileBasedProviderInput, "database">,
  {
    albums,
    artists,
    tracks,
  }: { albums: Album[]; artists: Artist[]; tracks: Track[] },
) =>
  Effect.gen(function* () {
    const albumsTable = yield* database.table("albums");
    const artistTable = yield* database.table("artists");
    const trackTable = yield* database.table("tracks");

    yield* albumsTable.putMany(albums);
    yield* artistTable.putMany(artists);
    yield* trackTable.putMany(tracks);
  });

const tryRetrieveOrCreateArtist = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  artistName: string,
): Effect.Effect<Artist> =>
  Effect.gen(function* () {
    const artistTable = yield* database.table("artists");
    const existingArtist = yield* artistTable.byField("name", artistName);

    return Option.isNone(existingArtist)
      ? yield* createArtist({ crypto }, artistName)
      : existingArtist.value;
  });

const tryRetrieveOrCreateAlbum = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  artistId: Artist["id"],
  albumName: string,
): Effect.Effect<Album> =>
  Effect.gen(function* () {
    const albumTable = yield* database.table("albums");
    const existingAlbum = yield* albumTable.byFields([
      ["name", albumName],
      ["artistId", artistId],
    ]);

    return Option.isNone(existingAlbum)
      ? yield* createAlbum({ crypto }, albumName, artistId)
      : existingAlbum.value;
  });

const tryRetrieveOrCreateTrack = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  artistId: Artist["id"],
  albumId: Album["id"],
  metadata: TrackMetadata,
): Effect.Effect<Track> =>
  Effect.gen(function* () {
    const trackTable = yield* database.table("tracks");
    const existingTrack = yield* trackTable.byFields([
      ["name", metadata?.title || "Unknown Title"],
      ["mainArtistId", artistId],
      ["albumId", albumId],
    ]);

    return Option.isNone(existingTrack)
      ? yield* createTrack({ crypto }, artistId, albumId, metadata)
      : existingTrack.value;
  });

const createArtist = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  name: string,
): Effect.Effect<Artist> =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;
    return {
      id,
      name,
      imageUrl: Option.some("https://example.com/image.jpg"),
    };
  });

const createAlbum = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  name: string,
  artistId: Artist["id"],
): Effect.Effect<Album> =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;
    return {
      id,
      name,
      artistId,
      imageUrl: Option.some("https://example.com/image.jpg"),
    };
  });

const createTrack = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  artistId: Artist["id"],
  albumId: Album["id"],
  metadata: TrackMetadata,
): Effect.Effect<Track> =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;

    return {
      id,
      mainArtistId: artistId,
      albumId,
      secondaryArtistIds: [] /* TODO: Implement this */,
      name: metadata.title ?? "Unknown Title",
      trackNumber: metadata.trackNumber ?? 1,
    };
  });
