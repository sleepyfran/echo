import { normalizeForComparison } from "@echo/core-strings";
import {
  type Artist,
  Database,
  type Track,
  type Tables,
  type Table,
  type StringKeyOf,
  type Album,
} from "@echo/core-types";
import Dexie, { type Table as DexieTable } from "dexie";
import { Effect, Layer, Option, Ref } from "effect";

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
  byField: (field, value) =>
    Effect.gen(function* () {
      const table = db[tableName];
      const normalizedFilter = normalizeForComparison(value);

      return yield* Effect.tryPromise<TSchema>(
        () =>
          table.get({
            [field]: normalizedFilter,
          }) as unknown as PromiseLike<TSchema>,
      ).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map(Option.fromNullable),
      );
    }),
  byFields: (fieldWithValues) =>
    Effect.gen(function* () {
      const table = db[tableName];
      const normalizedFilters = fieldWithValues.map(([field, value]) => [
        field,
        normalizeForComparison(value),
      ]);

      return yield* Effect.tryPromise<TSchema>(
        () => table.get(normalizedFilters) as unknown as PromiseLike<TSchema>,
      ).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map(Option.fromNullable),
      );
    }),
  filtered: ({ fieldOrFields, filter, limit = 100 }) =>
    Effect.gen(function* () {
      const table = db[tableName];
      const normalizedFilter = normalizeForComparison(filter);

      return yield* Effect.tryPromise<TSchema[]>(
        () =>
          table
            .filter((tableRow) =>
              normalizedFieldValues<TSchemaKey, TSchema>(
                tableRow as TSchema,
                fieldOrFields,
              ).some((value) => value.includes(normalizedFilter)),
            )
            .limit(limit)
            .toArray() as unknown as PromiseLike<TSchema[]>,
      ).pipe(
        Effect.catchAllCause(catchToDefaultAndLog),
        Effect.map((res) => res ?? []),
      );
    }),
});

/**
 * Returns the normalized values of the given fields in the given table row.
 */
const normalizedFieldValues = <
  TSchemaKey extends keyof Tables,
  TSchema extends Tables[TSchemaKey],
>(
  tableRow: TSchema,
  filterFields: StringKeyOf<TSchema> | StringKeyOf<TSchema>[],
): string[] => {
  const keys = Array.isArray(filterFields) ? filterFields : [filterFields];
  return keys.map((key) => {
    return normalizeForComparison(tableRow[key] as string);
  });
};

/**
 * Internal class that interfaces with Dexie. Should NOT be exposed nor used
 * outside of this package.
 */
class DexieDatabase extends Dexie {
  albums!: DexieTable<Album>;
  artists!: DexieTable<Artist>;
  tracks!: DexieTable<Track>;

  constructor() {
    super("echo");

    this.version(1).stores({
      albums: "id, name, artistId",
      artists: "id, name",
      tracks: "id, mainArtistId, albumId",
    });
  }
}
