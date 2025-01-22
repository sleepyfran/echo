import { Effect } from "effect";
import { useRuntime } from "../contexts/RuntimeContext.tsx";
import type { EchoRuntimeServices } from "@echo/services-bootstrap-runtime";

/**
 * Returns a function that runs the given effect.
 */
export const useEffectRunner = <TResult>(
  effect: Effect.Effect<TResult, never, EchoRuntimeServices>
) => {
  const runtime = useRuntime();
  return () => runtime.runPromise(effect);
};

/**
 * Returns a function that passes the given parameters into the given function
 * and runs the resulting effect.
 */
export const useEffectRunnerFn = <TParams, TResult, TError>(
  effectFn: (params: TParams) => Effect.Effect<TResult, TError, EchoRuntimeServices>
) => {
  const runtime = useRuntime();
  return (params: TParams) => runtime.runPromise(effectFn(params));
};
