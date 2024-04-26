import { Cause, Effect, Exit } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

type RunEffectCallback = () => void;

type EffectResultState<TResult, TError> =
  | { state: "initial" }
  | { state: "success"; result: TResult }
  | { state: "failure"; error: TError | string };

/**
 * Runs the given Effect (from effect-ts, not the React concept) when the
 * callback is called via `Effect.runPromiseExit`, returning back a union of
 * possible states based on the Effect's result.
 *
 * TODO: Come up with a better name? What can we possibly call this? 🤬
 */
export const useEffectTs = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
): [RunEffectCallback, EffectResultState<TResult, TError>] => {
  const abortControllerRef = useRef<AbortController | null>();
  const [state, setState] = useState<EffectResultState<TResult, TError>>({
    state: "initial",
  });

  // Wrap the effect in a ref to avoid re-running the effect when the component
  // re-renders.
  const effectRef = useRef(effect);

  // Having a custom abort controller allows us to cancel the effect when the
  // component that is using this hook is unmounted.
  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  const executeEffect = useCallback(() => {
    Effect.runPromiseExit(effectRef.current, {
      signal: abortControllerRef.current?.signal,
    }).then((exit) =>
      Exit.match(exit, {
        onSuccess: (value) => setState({ state: "success", result: value }),
        onFailure: (error) =>
          Cause.match(error, {
            onFail: (error) => setState({ state: "failure", error }),
            onDie: () =>
              setState({ state: "failure", error: "Unexpected die" }),
            onParallel: () =>
              setState({ state: "failure", error: "Unexpected parallel" }),
            onSequential: () => null,
            onEmpty: null,
            onInterrupt: () => null,
          }),
      }),
    );
  }, []);

  return [executeEffect, state] as const;
};
