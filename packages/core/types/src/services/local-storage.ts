import { Effect, Option } from "effect";
import * as S from "@effect/schema/Schema";

/**
 * Defines all the possible namespaces that can be used to store data in the
 * local storage.
 */
export type LocalStorageNamespace = "media-provider-start-args";

/**
 * Service that allows to cache active media providers and observe changes to
 * them.
 */
export type ILocalStorage = {
  /**
   * Sets the given value in the local storage under the specified namespace and
   * key, using the provided schema to serialize it. If the value already exists,
   * it will be overwritten.
   */
  readonly set: <T, I>(
    namespace: LocalStorageNamespace,
    key: string,
    schema: S.Schema<T, I>,
    value: T,
  ) => Effect.Effect<void>;

  /**
   * Attempts to retrieve and deserialize a value from the local storage under
   * the specified namespace and key using the provided schema. If the value
   * does not exist or cannot be deserialized using the schema, it returns none.
   */
  readonly get: <T, I>(
    namespace: LocalStorageNamespace,
    key: string,
    schema: S.Schema<T, I>,
  ) => Effect.Effect<Option.Option<T>>;

  /**
   * Deletes the value stored in the local storage under the specified namespace
   * and key. If the value does not exist, this operation is a no-op.
   */
  readonly remove: (
    namespace: LocalStorageNamespace,
    key: string,
  ) => Effect.Effect<void>;
};

/**
 * Tag to identify the LocalStorage service.
 */
export class LocalStorage extends Effect.Tag("@echo/core-types/LocalStorage")<
  LocalStorage,
  ILocalStorage
>() {}
