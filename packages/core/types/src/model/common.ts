import { Brand } from "effect";

/**
 * Wrapper around a string to indicate that it represents a GUID. It does not
 * perform any validation.
 */
export type Guid = string & Brand.Brand<"Guid">;
export const Guid = Brand.nominal<Guid>();
