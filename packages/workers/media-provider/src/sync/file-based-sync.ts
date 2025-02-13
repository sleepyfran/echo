import {
  type FileBasedProvider,
  type FolderMetadata,
  type FileMetadata,
  FileBasedProviderError,
  type ProviderMetadata,
  ProviderError,
  type MetadataProvider,
  type TrackMetadata,
  type Crypto,
  type Database,
  type DatabaseArtist,
  type DatabaseTrack,
  type DatabaseAlbum,
  ArtistId,
  AlbumId,
  TrackId,
  FileBasedProviderId,
  type ProviderId,
  type FileBasedStartArgs,
  type IBroadcaster,
  ProviderStatusChanged,
  MalformedFileError,
} from "@echo/core-types";
import { Effect, Match, Option, Schedule, Stream } from "effect";
import { head } from "effect/Array";
import { isSupportedAudioFile } from "@echo/core-files";
import {
  partiallyDownloadIntoStream,
  type DownloadError,
} from "./partial-downloader";
import { Genres } from "@echo/core-genres";

type SyncFileBasedProviderInput = {
  startArgs: FileBasedStartArgs;
  provider: FileBasedProvider;
  broadcaster: IBroadcaster;
  metadataProvider: MetadataProvider;
  database: Database;
  crypto: Crypto;
  rootFolder: FolderMetadata;
};

type SyncState = {
  albums: Map<string, DatabaseAlbum>;
  artists: Map<string, DatabaseArtist>;
};

export const syncFileBasedProvider = ({
  startArgs,
  broadcaster,
  metadataProvider,
  provider,
  rootFolder,
  database,
  crypto,
}: SyncFileBasedProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting sync for provider ${startArgs.metadata.id}`);

    yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs,
        status: { _tag: "syncing" },
      }),
    );

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
      startArgs.metadata,
      processed,
    );

    yield* saveToDatabase({ database }, normalizedData);

    // TODO: Ignore and use album count.
    const syncedTracks = Array.from(normalizedData.albums.values()).reduce(
      (acc, album) => acc + album.tracks.length,
      0,
    );

    return yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs,
        status: {
          _tag: "synced",
          lastSyncedAt: new Date(),
          tracksWithError: errors.length,
          syncedTracks,
        },
      }),
    );
  }).pipe(
    Effect.catchAll(() =>
      Effect.gen(function* () {
        yield* Effect.logError(
          `Sync of ${startArgs.metadata.id} has failed, reporting error with API to main thread.`,
        );

        // If we end up here, the provider has failed to retrieve any
        // files, since the stream is made to never fail. Report back an error.
        yield* broadcaster.broadcast(
          "mediaProvider",
          new ProviderStatusChanged({
            startArgs,
            status: { _tag: "errored", error: ProviderError.ApiGatewayError },
          }),
        );
      }),
    ),
  );

const partiallyDownloadFile = (file: FileMetadata) =>
  // TODO: Implement retry with a bigger partial range if metadata is undefined.
  partiallyDownloadIntoStream(file, 0, 500000).pipe(
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
          Effect.tap(({ file }) =>
            Effect.logDebug(`Downloaded and processed ${file.name}`),
          ),
          Effect.tapError((error) =>
            Match.value(error).pipe(
              Match.tag("malformed-file", (error) =>
                Effect.logError(
                  `Failed to process metadata from file ${file.name} with error: ${error.innerException}`,
                ),
              ),
              Match.tag("no-body-returned", () =>
                Effect.logError(
                  `No body returned when downloading file ${file.name}`,
                ),
              ),
              Match.tag("unknown", () =>
                Effect.logError(
                  `Unknown error occurred while downloading file ${file.name}`,
                ),
              ),
              Match.exhaustive,
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
        errors: [] as (DownloadError | MalformedFileError | ProviderError)[],
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
  providerMetadata: ProviderMetadata,
  successes: { metadata: TrackMetadata; file: FileMetadata }[],
) =>
  Stream.fromIterable(successes).pipe(
    Stream.runFoldEffect(
      {
        albums: new Map(),
        artists: new Map(),
      } as SyncState,
      (accumulator, { metadata, file }) =>
        Effect.gen(function* () {
          const mainArtistName = metadata.artists?.[0] ?? "Unknown Artist";
          const artist = yield* tryRetrieveOrCreateArtist(
            { database, crypto },
            mainArtistName,
            accumulator.artists,
          );

          const album = yield* tryRetrieveOrCreateAlbum(
            { database, crypto },
            artist.id,
            metadata.album ?? "Unknown Album",
            metadata.embeddedCover ?? null,
            metadata.year ?? null,
            accumulator.albums,
            providerMetadata.id,
            metadata,
            file,
          );

          return {
            albums: new Map([...accumulator.albums, [album.name, album]]),
            artists: new Map([...accumulator.artists, [artist.name, artist]]),
          };
        }),
    ),
  );

const saveToDatabase = (
  { database }: Pick<SyncFileBasedProviderInput, "database">,
  { albums, artists }: SyncState,
) =>
  Effect.gen(function* () {
    const albumsTable = yield* database.table("albums");
    const artistTable = yield* database.table("artists");

    yield* albumsTable.putMany(Array.from(albums.values()));
    yield* artistTable.putMany(Array.from(artists.values()));
  });

const tryRetrieveOrCreateArtist = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  artistName: string,
  processedArtists: Map<string, DatabaseArtist>,
): Effect.Effect<DatabaseArtist> =>
  Effect.gen(function* () {
    const artistTable = yield* database.table("artists");

    const existingArtist = yield* artistTable
      .filtered({
        filter: { name: artistName },
        limit: 1,
      })
      .pipe(
        Effect.map(head),
        Effect.map(
          Option.orElse(() =>
            Option.fromNullable(processedArtists.get(artistName)),
          ),
        ),
      );

    return Option.isNone(existingArtist)
      ? yield* createArtist({ crypto }, artistName)
      : existingArtist.value;
  });

const tryRetrieveOrCreateAlbum = (
  { database, crypto }: Pick<SyncFileBasedProviderInput, "database" | "crypto">,
  artistId: DatabaseArtist["id"],
  albumName: string,
  embeddedCover: Blob | null,
  releaseYear: number | null,
  processedAlbums: Map<string, DatabaseAlbum>,
  providerId: ProviderId,
  trackMetadata: TrackMetadata,
  fileMetadata: FileMetadata,
): Effect.Effect<DatabaseAlbum> =>
  Effect.gen(function* () {
    const albumTable = yield* database.table("albums");
    const existingAlbum = yield* albumTable
      .filtered({
        filter: { name: albumName, artistId },
        limit: 1,
      })
      .pipe(
        Effect.map(head),
        Effect.map(
          Option.orElse(() =>
            Option.fromNullable(processedAlbums.get(albumName)),
          ),
        ),
      );

    if (Option.isNone(existingAlbum)) {
      return yield* createAlbum(
        { crypto },
        albumName,
        artistId,
        embeddedCover,
        releaseYear,
        providerId,
        trackMetadata,
        fileMetadata,
      );
    }

    const track = yield* createTrack(
      { crypto },
      artistId,
      trackMetadata,
      fileMetadata,
    );

    const includesTrack = existingAlbum.value.tracks.some(
      (existingTrack) =>
        existingTrack.name === track.name &&
        existingTrack.trackNumber === track.trackNumber,
    );
    const tracks = includesTrack
      ? existingAlbum.value.tracks
      : [...existingAlbum.value.tracks, track];

    tracks.sort((a, b) => a.trackNumber - b.trackNumber);

    const genres = Genres.addTo(
      existingAlbum.value.genres,
      Genres.flatten(trackMetadata.genre ?? []),
    );

    return {
      ...existingAlbum.value,
      genres,
      tracks,
    };
  });

const createArtist = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  name: string,
): Effect.Effect<DatabaseArtist> =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;

    return {
      id: ArtistId(id),
      name,
      image: null,
    };
  });

const createAlbum = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  name: string,
  artistId: DatabaseArtist["id"],
  embeddedCover: Blob | null,
  releaseYear: number | null,
  providerId: ProviderId,
  trackMetadata: TrackMetadata,
  fileMetadata: FileMetadata,
): Effect.Effect<DatabaseAlbum> =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;
    const initialTrack = yield* createTrack(
      { crypto },
      artistId,
      trackMetadata,
      fileMetadata,
    );

    return {
      id: AlbumId(id),
      name,
      artistId,
      embeddedCover,
      releaseYear,
      providerId,
      genres: Genres.flatten(trackMetadata.genre ?? []),
      tracks: [initialTrack],
    };
  });

const createTrack = (
  { crypto }: Pick<SyncFileBasedProviderInput, "crypto">,
  artistId: DatabaseArtist["id"],
  metadata: TrackMetadata,
  file: FileMetadata,
) =>
  Effect.gen(function* () {
    const id = yield* crypto.generateUuid;

    return {
      id: TrackId(id),
      mainArtistId: artistId,
      secondaryArtistIds: [] /* TODO: Implement this */,
      name: metadata.title ?? "Unknown Title",
      trackNumber: metadata.trackNumber ?? 1,
      resource: {
        type: "file",
        provider: FileBasedProviderId.OneDrive /* TODO: Take from metadata. */,
        fileId: file.id,
      },
      durationInSeconds: metadata.lengthInSeconds ?? 0,
    } satisfies DatabaseTrack;
  });
