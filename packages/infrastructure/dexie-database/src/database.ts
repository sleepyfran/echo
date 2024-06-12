import { normalizeForComparison } from "@echo/core-strings";
import {
  type Artist,
  Database,
  type Track,
  type Tables,
  type Table,
  type StringKeyOf,
} from "@echo/core-types";
import Dexie, { type Table as DexieTable } from "dexie";
import { Effect, Layer, Ref } from "effect";

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

const createTable = <
  TSchemaKey extends keyof Tables,
  TSchema extends Tables[TSchemaKey],
>(
  db: DexieDatabase,
  tableName: TSchemaKey,
): Table<TSchemaKey, TSchema> => ({
  byId: (id) =>
    Effect.gen(function* () {
      const table = db[tableName];
      return yield* Effect.tryPromise<TSchema>(
        () =>
          table
            .where("id")
            .equals(id)
            .first() as PromiseLike<TSchema> /* Big "trust me, bro", but trust me, bro. */,
      ).pipe(Effect.option);
    }),
  filtered: ({ fieldOrFields, filter, limit = 100 }) =>
    Effect.gen(function* () {
      const table = db[tableName];
      const normalizedFilter = normalizeForComparison(filter);

      return yield* Effect.promise<TSchema[]>(
        () =>
          table
            .filter((tableRow) =>
              normalizedFieldValues<TSchemaKey, TSchema>(
                tableRow as TSchema,
                fieldOrFields,
              ).some((value) => value.includes(normalizedFilter)),
            )
            .limit(limit)
            .toArray() as PromiseLike<
            TSchema[]
          > /* Another big "trust me, bro", but trust me, bro. */,
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
  artists!: DexieTable<Artist>;
  tracks!: DexieTable<Track>;

  constructor() {
    super("echo");

    this.version(1).stores({
      artists: "id, name",
      tracks: "id, name",
    });
  }
}
