import { Context, Effect, Option, Stream } from "effect";
import type {
  DatabaseAlbum,
  DatabaseArtist,
  DatabaseTrack,
} from "./database-models.ts";

/**
 * Error that is thrown when the database raises an unexpected error while
 * observing a table.
 */
export class DatabaseObserveError extends Error {
  constructor(tableName: string, error: unknown) {
    super(
      `Database raised an unexpected error while observing the ${tableName} table. Error: ${JSON.stringify(error)}`,
    );
  }
}

/**
 * Keys for all the available tables in the database with their associated
 * data type.
 */
export type Tables = {
  albums: DatabaseAlbum;
  artists: DatabaseArtist;
  tracks: DatabaseTrack;
};

/**
 * Abstraction over a specific database that provides access to specific tables
 * and their data.
 */
export type Database = {
  /**
   * Retrieves a specific table from the database by its name.
   */
  table: <T extends keyof Tables>(
    tableName: T,
  ) => Effect.Effect<Table<T, Tables[T]>>;
};

/**
 * Tag to identify the database service.
 */
export const Database = Context.GenericTag<Database>(
  "@echo/core-types/Database",
);

/**
 * Returns the keys of T that are strings.
 */
export type StringKeyOf<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/**
 * Abstraction over a specific table in the database that provides access to
 * specific records and their data.
 */
export type Table<
  TTableKey extends keyof Tables,
  TSchema extends Tables[TTableKey],
> = {
  /**
   * Adds the given record to the table.
   */
  readonly addOne: (record: TSchema) => Effect.Effect<void>;

  /**
   * Adds the given records to the table and returns the number of records
   * added.
   */
  readonly addMany: (records: TSchema[]) => Effect.Effect<number>;

  /**
   * Adds or updates the given record in the table. Returns the number of
   * records added or updated.
   */
  readonly putMany: (records: TSchema[]) => Effect.Effect<number>;

  /**
   * Retrieves a specific record from the table by its ID.
   */
  readonly byId: (id: TSchema["id"]) => Effect.Effect<Option.Option<TSchema>>;

  /**
   * Retrieves a subset of records from the table that match the given filter
   * in a stream.
   */
  readonly filtered: (opts: {
    /**
     * Value to filter the records by.
     */
    filter: { [K in StringKeyOf<TSchema>]?: TSchema[K] };

    /**
     * Maximum number of records to return. If not specified, the default will be
     * chosen by each specific implementation.
     */
    limit?: number;
  }) => Effect.Effect<TSchema[]>;

  /**
   * Streams all records from the table.
   */
  readonly observe: () => Effect.Effect<
    Stream.Stream<TSchema[], DatabaseObserveError>
  >;
};
