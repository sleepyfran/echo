import { Context, Effect, Option } from "effect";
import type { Artist, Track } from "../model";

/**
 * Keys for all the available tables in the database with their associated
 * data type.
 */
export type Tables = {
  artists: Artist;
  tracks: Track;
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
   * Retrieves a specific record from the table by a specific field.
   */
  readonly byField: <TField extends StringKeyOf<TSchema>>(
    field: TField,
    value: string,
  ) => Effect.Effect<Option.Option<TSchema>>;

  /**
   * Retrieves a subset of records from the table that match the given filter
   * in a stream.
   */
  readonly filtered: (opts: {
    /**
     * Field or fields by which to filter the records.
     */
    fieldOrFields: StringKeyOf<TSchema> | StringKeyOf<TSchema>[];

    /**
     * Value to filter the records by.
     */
    filter: string;

    /**
     * Maximum number of records to return. If not specified, the default will be
     * chosen by each specific implementation.
     */
    limit?: number;
  }) => Effect.Effect<TSchema[]>;
};
