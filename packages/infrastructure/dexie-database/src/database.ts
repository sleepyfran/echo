import { normalizeForComparison } from "@echo/core-strings";
import {
  type DatabaseArtist,
  Database,
  type DatabaseTrack,
  type Tables,
  type Table,
  type DatabaseAlbum,
} from "@echo/core-types";
import Dexie, { type Table as DexieTable, liveQuery } from "dexie";
import { Effect, Layer, Option, PubSub, Ref, Stream } from "effect";

/**
 * Implementation of the Database service using Dexie.js.
 */
export const DexieDatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    yield* Effect.logTrace("Creating Dexie database");

    const _db = yield* Ref.make(new DexieDatabase());

    return Database.of({
      table: (tableName) =>
        Effect.gen(function* () {
          const db = yield* _db.get;
          return createTable(db, tableName);
        }),
    });
  }),
);

const catchToDefaultAndLog = (error: unknown) =>
  Effect.gen(function* () {
    yield* Effect.logError(error);
    return null;
  });

const createTable = <
  TSchemaKey extends keyof Tables,
  TSchema extends Tables[TSchemaKey],
>(
  db: DexieDatabase,
  tableName: TSchemaKey,
): Table<TSchemaKey, TSchema> => ({
  addOne: (record) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() => table.add(record));
    }),
  addMany: (records) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() =>
        table.bulkAdd(records, { allKeys: true }),
      ).pipe(Effect.map((keys) => keys.length));
    }),
  putMany: (records) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() =>
        table.bulkPut(records, { allKeys: true }),
      ).pipe(Effect.map((keys) => keys.length));
    }),
  byId: (id) =>
    Effect.gen(function* () {
      const table = db[tableName];
      return yield* Effect.tryPromise<TSchema>(
        () =>
          table.get({
            id,
          }) as unknown as PromiseLike<TSchema>,
      ).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map(Option.fromNullable),
      );
    }),
  filtered: ({ filter, limit = 100 }) =>
    Effect.gen(function* () {
      const table = db[tableName];

      return yield* Effect.tryPromise<TSchema[]>(
        () =>
          table
            .filter((tableRow) =>
              Object.keys(filter).some((key) => {
                const schemaTable = tableRow as TSchema;
                return normalizeForComparison(
                  schemaTable[key as keyof TSchema] as string,
                ).includes(
                  normalizeForComparison(
                    filter[key as keyof typeof filter] as string,
                  ),
                );
              }),
            )
            .limit(limit)
            .toArray() as unknown as PromiseLike<TSchema[]>,
      ).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map((res) => res ?? []),
      );
    }),
  observe: () =>
    Effect.gen(function* () {
      const table = db[tableName];

      const pubsub = yield* PubSub.sliding<TSchema>(500);

      const subscription = liveQuery(
        () => table.toArray() as unknown as Promise<TSchema[]>,
      ).subscribe(
        (items) => Effect.runPromise(pubsub.publishAll(items)), // next
        () => Effect.runPromise(pubsub.shutdown), // error
        () => Effect.runPromise(pubsub.shutdown), // complete
      );

      return Stream.fromPubSub(pubsub).pipe(
        Stream.ensuring(Effect.sync(subscription.unsubscribe)),
      );
    }),
});

/**
 * Internal class that interfaces with Dexie. Should NOT be exposed nor used
 * outside of this package.
 */
class DexieDatabase extends Dexie {
  albums!: DexieTable<DatabaseAlbum>;
  artists!: DexieTable<DatabaseArtist>;
  tracks!: DexieTable<DatabaseTrack>;

  constructor() {
    super("echo");

    this.version(1).stores({
      albums: "id, name, artistId",
      artists: "id, name",
      tracks: "id, mainArtistId, albumId",
    });
  }
}
