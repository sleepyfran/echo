import {
  ProviderError,
  type AlbumWithTracks,
  type ApiBasedProvider,
  type ApiBasedStartArgs,
  type Artist,
  type BroadcastChannel,
  type Database,
  type DatabaseAlbum,
  type DatabaseArtist,
  type DatabaseTrack,
  type MediaProviderBroadcastSchema,
} from "@echo/core-types";
import { Effect, Option, Stream } from "effect";
import { head } from "effect/Array";

type SyncApiBasedProviderInput = {
  startArgs: ApiBasedStartArgs;
  broadcastChannel: BroadcastChannel<MediaProviderBroadcastSchema["worker"]>;
  provider: ApiBasedProvider;
  database: Database;
};

type SyncState = {
  albums: DatabaseAlbum[];
  artists: DatabaseArtist[];
  tracks: DatabaseTrack[];
};

export const syncApiBasedProvider = ({
  startArgs,
  broadcastChannel,
  provider,
  database,
}: SyncApiBasedProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting sync for provider ${startArgs.metadata.id}`);

    yield* broadcastChannel.send("reportStatus", {
      startArgs,
      status: { _tag: "syncing" },
    });

    yield* Effect.log("Listing remote albums on the provider");
    const providerAlbums = yield* provider.listAlbums;
    const { albums, artists, tracks } = yield* normalizeData(
      { database },
      providerAlbums,
    );

    yield* saveToDatabase({ database }, { albums, artists, tracks });

    yield* broadcastChannel.send("reportStatus", {
      startArgs,
      status: {
        _tag: "synced",
        lastSyncedAt: new Date(),
        syncedTracks: tracks.length,
        tracksWithError: 0,
      },
    });
  }).pipe(
    Effect.catchAll(() =>
      Effect.gen(function* () {
        yield* Effect.logError(
          `Sync of ${startArgs.metadata.id} has failed, reporting error with API to main thread.`,
        );

        // If we end up here, the provider has failed to communicate with the
        // API.
        yield* broadcastChannel.send("reportStatus", {
          startArgs,
          status: { _tag: "errored", error: ProviderError.ApiGatewayError },
        });
      }),
    ),
  );

const normalizeData = (
  { database }: Pick<SyncApiBasedProviderInput, "database">,
  albums: AlbumWithTracks[],
) =>
  Stream.fromIterable(albums).pipe(
    Stream.runFoldEffect(
      {
        albums: [],
        artists: [],
        tracks: [],
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
              },
            ],
            artists: [...accumulator.artists, artist],
            tracks: [
              ...accumulator.tracks,
              ...album.tracks.map((track) => ({
                ...track,
                mainArtistId: artist.id,
                secondaryArtistIds: track.secondaryArtists.map(
                  (artist) => artist.id,
                ),
                albumId: album.id,
              })),
            ],
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
  { albums, artists, tracks }: SyncState,
) =>
  Effect.gen(function* () {
    const albumTable = yield* database.table("albums");
    const artistTable = yield* database.table("artists");
    const trackTable = yield* database.table("tracks");

    yield* albumTable.putMany(albums);
    yield* artistTable.putMany(artists);
    yield* trackTable.putMany(tracks);
  });
