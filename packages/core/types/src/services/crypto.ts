import { Context, Effect } from "effect";
import type { Guid } from "../model";

/**
 * Interface around crypto-related operations like generating UUIDs.
 */
export type Crypto = {
  readonly generateUuid: Effect.Effect<Guid>;
};

/**
 * Tag to identify the crypto service.
 */
export const Crypto = Context.GenericTag<Crypto>("@echo/core-types/Crypto");
