import { Brand } from "effect";

/**
 * Wrapper around a string to indicate that it represents a GUID. It does not
 * perform any validation.
 */
export type Guid = string & Brand.Brand<"Guid">;
export const Guid = Brand.nominal<Guid>();

/**
 * Wrapper around a string to represent a generic ID. It does not perform any
 * validation other than requiring the string to be non-empty.
 */
export type GenericId = string & Brand.Brand<"GenericId">;
export const GenericId = Brand.nominal<GenericId>();
