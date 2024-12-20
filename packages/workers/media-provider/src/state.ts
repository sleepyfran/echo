import type { ProviderId } from "@echo/core-types";
import type { ParseError } from "@effect/schema/ParseResult";
import { Context, Ref } from "effect";
import type { RuntimeFiber } from "effect/Fiber";

/**
 * State kept by the media provider worker.
 */
export type WorkerState = {
  /**
   * Keeps a reference to the specific runtime fiber that is currently running
   * a provider inside.
   */
  fiberByProvider: Map<ProviderId, RuntimeFiber<void, ParseError>>;
};

/**
 * Tag that can provide a ref to the current worker state.
 */
export class WorkerStateRef extends Context.Tag(
  "@echo/workers-media-provider/WorkerStateRef",
)<WorkerStateRef, Ref.Ref<WorkerState>>() {}
