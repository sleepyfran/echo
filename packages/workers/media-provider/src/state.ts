import type { ProviderId, ProviderStartArgs } from "@echo/core-types";
import type { ParseError } from "effect/ParseResult";
import { Context, Option, Ref } from "effect";
import type { RuntimeFiber } from "effect/Fiber";

type ProviderState = {
  /**
   * Arguments with which the provider was started.
   */
  startArgs: ProviderStartArgs;

  /**
   * The fiber that is currently running the provider, if any.
   */
  fiber: Option.Option<RuntimeFiber<void, ParseError>>;
};

/**
 * State kept by the media provider worker.
 */
export type WorkerState = {
  /**
   * Keeps a reference to the current provider state, which includes the
   * arguments that were used in the last start command and the fiber that is
   * currently running the provider.
   */
  stateByProvider: Map<ProviderId, ProviderState>;
};

/**
 * Tag that can provide a ref to the current worker state.
 */
export class WorkerStateRef extends Context.Tag(
  "@echo/workers-media-provider/WorkerStateRef",
)<WorkerStateRef, Ref.Ref<WorkerState>>() {}
