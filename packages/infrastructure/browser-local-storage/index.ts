import { LocalStorage, type LocalStorageNamespace } from "@echo/core-types";
import * as S from "@effect/schema/Schema";
import { Effect, Layer, Option, pipe } from "effect";

const createKey = (namespace: LocalStorageNamespace, key: string) =>
  `${namespace}:${key}`;

const make = LocalStorage.of({
  set: (namespace, key, schema, value) =>
    Effect.sync(() => {
      const encode = S.encodeSync(schema);
      const encodedValue = encode(value);
      localStorage.setItem(
        createKey(namespace, key),
        JSON.stringify(encodedValue),
      );
    }),

  get: (namespace, key, schema) =>
    Effect.sync(() =>
      pipe(
        localStorage.getItem(createKey(namespace, key)),
        Option.fromNullable,
        Option.map((value) => JSON.parse(value)),
        Option.flatMap(S.decodeUnknownOption(schema)),
      ),
    ),

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
