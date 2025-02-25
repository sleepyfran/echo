import {
  ProviderError,
  ProviderStatusChanged,
  type Album,
  type ApiBasedProvider,
  type ApiBasedStartArgs,
  type Artist,
  type Database,
  type DatabaseAlbum,
  type DatabaseArtist,
  type IBroadcaster,
} from "@echo/core-types";
import { Effect, Option, Stream } from "effect";
import { head } from "effect/Array";

type SyncApiBasedProviderInput = {
  startArgs: ApiBasedStartArgs;
  broadcaster: IBroadcaster;
  provider: ApiBasedProvider;
  database: Database;
};

type SyncState = {
  albums: DatabaseAlbum[];
  artists: DatabaseArtist[];
};

export const syncApiBasedProvider = ({
  startArgs,
  broadcaster,
  provider,
  database,
}: SyncApiBasedProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting sync for provider ${startArgs.metadata.id}`);

    yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs,
        status: { _tag: "syncing" },
      }),
    );

    yield* Effect.log("Listing remote albums on the provider");
    const providerAlbums = yield* provider.listAlbums;
    const { albums, artists } = yield* normalizeData(
      { database },
      providerAlbums,
    );

    yield* saveToDatabase({ database }, { albums, artists });

    // TODO: Ignore and use album count.
    const syncedTracks = albums.reduce(
      (acc, album) => acc + album.tracks.length,
      0,
    );

    yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs,
        status: {
          _tag: "synced",
          lastSyncedAt: new Date(),
          syncedTracks,
          tracksWithError: 0,
        },
      }),
    );
  }).pipe(
    Effect.catchAll(() =>
      Effect.gen(function* () {
        yield* Effect.logError(
          `Sync of ${startArgs.metadata.id} has failed, reporting error with API to main thread.`,
        );

        // If we end up here, the provider has failed to communicate with the
        // API.
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

const normalizeData = (
  { database }: Pick<SyncApiBasedProviderInput, "database">,
  albums: Album[],
) =>
  Stream.fromIterable(albums).pipe(
    Stream.runFoldEffect(
      {
        albums: [],
        artists: [],
      } as SyncState,
      (accumulator, album) =>
        Effect.gen(function* () {
          const artist = yield* tryFindExisting({ database }, album.artist);

          return {
            albums: [
              ...accumulator.albums,
              {
                ...album,
                artistId: artist.id,
                embeddedCover: Option.getOrNull(album.embeddedCover),
                releaseYear: Option.getOrNull(album.releaseYear),
                tracks: album.tracks.map((track) => ({
                  ...track,
                  mainArtistId: artist.id,
                  secondaryArtistIds: track.secondaryArtists.map(
                    (artist) => artist.id,
                  ),
                  albumId: album.id,
                })),
              },
            ],
            artists: [...accumulator.artists, artist],
          };
        }),
    ),
  );

const tryFindExisting = (
  { database }: Pick<SyncApiBasedProviderInput, "database">,
  artist: Artist,
): Effect.Effect<DatabaseArtist> =>
  Effect.gen(function* () {
    const artistTable = yield* database.table("artists");
    const existingArtistOrCurrent = yield* artistTable
      .filtered({
        filter: { name: artist.name },
        limit: 1,
      })
      .pipe(
        Effect.map(head),
        Effect.map(
          Option.getOrElse(() => ({
            ...artist,
            image: Option.getOrNull(artist.image),
          })),
        ),
      );

    return existingArtistOrCurrent;
  });

const saveToDatabase = (
  { database }: Pick<SyncApiBasedProviderInput, "database">,
  { albums, artists }: SyncState,
) =>
  Effect.gen(function* () {
    const albumTable = yield* database.table("albums");
    const artistTable = yield* database.table("artists");

    yield* albumTable.putMany(albums);
    yield* artistTable.putMany(artists);
  });
