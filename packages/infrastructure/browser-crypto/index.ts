import { Crypto, Guid } from "@echo/core-types";
import { Effect, Layer } from "effect";

/**
 * Implementation of the crypto service that uses the browser's built-in
 * crypto API.
 */
export const BrowserCryptoLive = Layer.succeed(
  Crypto,
  Crypto.of({
    generateUuid: Effect.sync(() => Guid(crypto.randomUUID())),
  }),
);
