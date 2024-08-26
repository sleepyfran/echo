import { LocalStorage, type LocalStorageNamespace } from "@echo/core-types";
import { Effect, Layer, Option } from "effect";

const createKey = (namespace: LocalStorageNamespace, key: string) =>
  `${namespace}:${key}`;

const make = LocalStorage.of({
  set: (namespace, key, value) =>
    Effect.sync(() => {
      localStorage.setItem(createKey(namespace, key), JSON.stringify(value));
    }),

  get: <T>(namespace: LocalStorageNamespace, key: string) =>
    Effect.sync(() => {
      const item = localStorage.getItem(createKey(namespace, key));

      // TODO: Use Effect's schema here to ensure that we're actually properly parsing the value.
      return Option.fromNullable(item).pipe(
        Option.map((value) => JSON.parse(value) as unknown as T),
      );
    }),

  remove: (namespace, key) =>
    Effect.sync(() => {
      localStorage.removeItem(createKey(namespace, key));
    }),
});

/**
 * Implementation of the local storage service that uses the browser's local
 * storage to store data.
 */
export const BrowserLocalStorageLive = Layer.succeed(LocalStorage, make);
