import { normalizeForComparison } from "@echo/core-strings";
import {
  type DatabaseArtist,
  Database,
  type DatabaseTrack,
  type Tables,
  type Table,
  type DatabaseAlbum,
  DatabaseObserveError,
} from "@echo/core-types";
import Dexie, { type Table as DexieTable, liveQuery } from "dexie";
import { Effect, Layer, Option, Ref, Stream } from "effect";

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
  putOne: (record) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() =>
        table.put(record, { allKeys: true }),
      ).pipe(Effect.map((keys) => keys.length));
    }),
  putMany: (records) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() =>
        table.bulkPut(records, { allKeys: true }),
      ).pipe(Effect.map((keys) => keys.length));
    }),
  deleteMany: (key, equals) =>
    Effect.gen(function* () {
      const table = db[tableName] as DexieTable<TSchema>;
      return yield* Effect.promise(() =>
        table
          .where(key as string)
          .equals(normalizeForComparison(equals as string))
          .delete(),
      );
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
  all: Effect.gen(function* () {
    const table = db[tableName];

    return yield* Effect.tryPromise<TSchema[]>(
      () => table.toArray() as unknown as PromiseLike<TSchema[]>,
    ).pipe(
      Effect.catchAllCause(catchToDefaultAndLog),
      Effect.map((res) => res ?? []),
    );
  }),
  filtered: ({ filter, sort, limit = 100 }) =>
    Effect.gen(function* () {
      const table = db[tableName];

      return yield* Effect.tryPromise<TSchema[]>(() => {
        const query = table
          .filter((tableRow) =>
            Object.keys(filter).every((key) => {
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
          .limit(limit);

        if (sort) {
          let queryWithDirection = query;
          if (sort.direction === "desc") {
            queryWithDirection = query.reverse();
          }

          return queryWithDirection.sortBy(
            sort.field as string,
          ) as unknown as Promise<TSchema[]>;
        }

        return query.toArray() as unknown as Promise<TSchema[]>;
      }).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map((res) => res ?? []),
      );
    }),
  observe: () =>
    Effect.sync(() => {
      const table = db[tableName];
      return Stream.async((emit) => {
        const subscription = liveQuery(
          () => table.toArray() as unknown as Promise<TSchema[]>,
        ).subscribe(
          (items) => emit.single(items),
          (error) =>
            emit.fail(new DatabaseObserveError(tableName, error as unknown)),
          () => emit.end(),
        );

        return Effect.sync(subscription.unsubscribe);
      });
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
      albums: "id, name, artistId, providerId",
      artists: "id, name",
    });
  }
}
