import { Effect, Option } from "effect";

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
   * key, overwriting any existing value. The value must be serializable, since
   * it will always be stored as a string.
   */
  readonly set: <T>(
    namespace: LocalStorageNamespace,
    key: string,
    value: T,
  ) => Effect.Effect<void>;

  /**
   * Attempts to retrieve and deserialize a value from the local storage under
   * the specified namespace and key. If the value does not exist, `None` will
   * be returned.
   */
  readonly get: <T>(
    namespace: LocalStorageNamespace,
    key: string,
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
