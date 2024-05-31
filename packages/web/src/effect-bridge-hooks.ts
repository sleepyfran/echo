import { Cause, Effect, Exit, Match } from "effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RunEffectCallback = () => void;

/**
 * Represents the possible states of an effect.
 */
type EffectResultState<TResult, TError> =
  | { _tag: "initial" }
  | { _tag: "success"; result: TResult }
  | { _tag: "failure"; error: TError | string };

/**
 * Creates a matcher that can be used to match the different states of the
 * given effect's types.
 * @param _effect Unused, but required to infer the type of the effect.
 * @returns A matcher that can be used to match the different states of an effect.
 */
export const createResultMatcher = <TResult, TError>(
  _effect: Effect.Effect<TResult, TError>,
) => Match.type<EffectResultState<TResult, TError>>();

/**
 * Hook that creates a matcher that is referentially stable.
 * @param effect The effect to create a matcher for.
 * @returns A matcher that can be used to match the different states of the effect.
 */
export const useMatcherOf = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
) => {
  const effectRef = useRef(effect);
  return useMemo(() => createResultMatcher(effectRef.current), []);
};

const toFailure = <TError>(
  error: TError | string,
): EffectResultState<never, TError> => ({
  _tag: "failure",
  error,
});

/**
 * Returns a function that can be used to run an Effect (from effect-ts, not the
 * React concept) that returns a promise with the result of the effect.
 *
 * Syncs the effect with the component lifecycle, cancelling the effect when the
 * component is unmounted and attempts to handle the different states of the
 * effect without throwing errors.
 * @returns A function that can be used to run an Effect.
 */
export const useEffectRunner = () => {
  const abortControllerRef = useRef<AbortController | null>();

  // Having a custom abort controller allows us to cancel the effect when the
  // component that is using this hook is unmounted. However, in strict mode
  // React re-renders the component twice, which causes the cleanup to be called
  // for no reason at the beginning and causes errors. So, commenting this out
  // for now, it could be later re-introduced if needed.
  // useEffect(() => {
  //   abortControllerRef.current = new AbortController();

  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // });

  return useCallback(
    <TResult, TError>(
      effect: Effect.Effect<TResult, TError>,
    ): Promise<EffectResultState<TResult, TError>> =>
      Effect.runPromiseExit(effect, {
        signal: abortControllerRef.current?.signal,
      }).then((exit) =>
        Exit.match(exit, {
          onSuccess: (value) => ({ _tag: "success", result: value }),
          onFailure: (cause) => {
            if (Cause.isFailType(cause)) {
              return toFailure(cause.error);
            } else {
              return toFailure(Cause.pretty(cause));
            }
          },
        }),
      ),
    [],
  );
};

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
  const [state, setState] = useState<EffectResultState<TResult, TError>>({
    _tag: "initial",
  });
  const runEffect = useEffectRunner();

  // Wrap the effect in a ref to avoid re-running the effect when the component
  // re-renders.
  const effectRef = useRef(effect);

  const executeEffect = useCallback(
    () => runEffect(effectRef.current).then(setState),
    [runEffect],
  );

  return [executeEffect, state] as const;
};

/**
 * Runs the given Effect (from effect-ts, not the React concept) when the
 * component mounts, returning back a union of possible states based on the
 * Effect's result.
 * @param effect The effect to run when the component mounts.
 * @returns A union of possible states based on the Effect's result.
 */
export const useOnMountEffect = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
) => {
  const [runEffect, state] = useEffectTs(effect);

  useEffect(() => {
    runEffect();
  }, [runEffect]);

  return state;
};
