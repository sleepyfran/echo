import { Cause, Effect, Exit, Match, Sink, Stream } from "effect";
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
  _effect?: Effect.Effect<TResult, TError>,
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

/**
 * Hook that creates a matcher that is referentially stable for delayed effects.
 * @param _effectFn Unused, but required to infer the type of the effect.
 * @returns A matcher that can be used to match the different states of the effect.
 */
export const useMatcherOfDelayed = <TResult, TError>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _effectFn: (...args: any[]) => Effect.Effect<TResult, TError>,
) => useMemo(() => createResultMatcher<TResult, TError>(), []);

const toFailure = <TError>(
  error: TError | string,
): EffectResultState<never, TError> => ({
  _tag: "failure",
  error,
});

/**
 * Wrapper around `Effect.runPromiseExit` that runs the given effect and returns
 * a promise that resolves to the result of the effect.
 */
export const runEffect = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
): Promise<EffectResultState<TResult, TError>> => {
  return Effect.runPromiseExit(effect).then((exit) =>
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
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EffectCallback<TInput extends any[]> = (...args: TInput) => void;
type EffectMatcher<TResult, TError> = ReturnType<
  typeof useMatcherOfDelayed<TResult, TError>
>;

/**
 * Wraps the given callback in a function that accepts the same parameters but
 * runs the effect returned by the given callback when called, returning back a
 * union of possible states based on the effect's result and a matcher for that
 * union.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useEffectCallback = <TInput extends any[], TResult, TError>(
  effectFn: (...args: TInput) => Effect.Effect<TResult, TError>,
): [
  EffectCallback<TInput>,
  EffectResultState<TResult, TError>,
  EffectMatcher<TResult, TError>,
] => {
  const [state, setState] = useState<EffectResultState<TResult, TError>>({
    _tag: "initial",
  });

  // We don't want to re-run the effect when the component re-renders, so keep
  // it referentially stable. Later, when the callback is called, we'll run the
  // effect with the latest function.
  const _effectFn = useRef(effectFn);

  const executeEffect = useCallback((...args: TInput) => {
    const effect = _effectFn.current(...args);
    return runEffect(effect).then(setState);
  }, []);

  const matcher = useMatcherOfDelayed(effectFn);

  return [executeEffect, state, matcher] as const;
};

/**
 * Runs the given Effect (from effect-ts, not the React concept) when the
 * callback is called via `Effect.runPromiseExit`, returning back a union of
 * possible states based on the Effect's result and a matcher for that union.
 *
 * TODO: Come up with a better name? What can we possibly call this? 🤬
 */
export const useEffectTs = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
): [
  RunEffectCallback,
  EffectResultState<TResult, TError>,
  EffectMatcher<TResult, TError>,
] => useEffectCallback(() => effect);

/**
 * Runs the given Effect (from effect-ts, not the React concept) when the
 * component mounts, returning back a union of possible states based on the
 * Effect's result.
 * @param effect The effect to run when the component mounts.
 * @returns A union of possible states based on the Effect's result.
 */
export const useOnMountEffect = <TResult, TError>(
  effect: Effect.Effect<TResult, TError>,
): [EffectResultState<TResult, TError>, EffectMatcher<TResult, TError>] => {
  const [runEffect, state, matcher] = useEffectTs(effect);

  useEffect(() => {
    runEffect();
  }, [runEffect]);

  return [state, matcher];
};

/**
 * Represents the possible states of a stream.
 */
type StreamResultState<TResult, TError> =
  | { _tag: "empty" }
  | { _tag: "items"; items: TResult[] }
  | { _tag: "failure"; error: TError | string };

/**
 * Runs the given Effect (from effect-ts, not the React concept) and subscribes
 * to the returned stream when the component mounts, returning back a union of
 * possible states based on the result of the stream returned by the effect.
 * @param streamEffect The effect that returns a stream to subscribe to.
 * @returns A union of possible states based on the result of the stream.
 */
export const useStream = <TResult, TError>(
  streamEffect: Effect.Effect<Stream.Stream<TResult, TError>>,
): [
  StreamResultState<TResult, TError>,
  ReturnType<typeof Match.type<StreamResultState<TResult, TError>>>,
] => {
  const [result, setResult] = useState<TResult[]>([]);
  const [error, setError] = useState<TError | undefined>(undefined);
  const [streamEffectState, matcher] = useOnMountEffect(streamEffect);

  const streamMatcherRef = useRef(
    Match.type<StreamResultState<TResult, TError>>(),
  );

  useEffect(() => {
    Effect.runPromise(
      matcher.pipe(
        Match.tag("initial", () => Effect.void),
        Match.tag("success", (stream) =>
          stream.result.pipe(
            Stream.run(
              Sink.forEach((item) =>
                Effect.sync(() => {
                  setResult((current) => [...current, item]);
                }),
              ),
            ),
          ),
        ),
        Match.tag("failure", ({ error }) =>
          Effect.sync(() => setError(error as TError)),
        ),
        Match.exhaustive,
      )(streamEffectState),
    ).then(() => {
      console.log("Stream effect completed");
    });
  }, [streamEffectState, matcher]);

  return [
    error
      ? { _tag: "failure", error }
      : result.length === 0
        ? { _tag: "empty" }
        : { _tag: "items", items: result },
    streamMatcherRef.current,
  ];
};
