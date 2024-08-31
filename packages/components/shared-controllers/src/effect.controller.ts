import { type EchoRuntimeServices } from "@echo/services-bootstrap-runtime";
import { Effect } from "effect";
import type { ReactiveControllerHost } from "lit";
import type { StatusListener } from "./shared.interface";
import { EffectFnController } from "./effect-fn.controller";

/**
 * Controller that takes an effect that can be executed by the default runtime
 * of the application, and exposes a render method that maps each different
 * status of the effect to a renderer. This is meant to be used with effects
 * that are one-shot, meaning they only produce a single value. For multiple
 * values, use the StreamEffectController, which can handle streams and
 * subscription refs.
 */
export class EffectController<A, E> extends EffectFnController<void, A, E> {
  constructor(
    host: ReactiveControllerHost,
    _effect: Effect.Effect<A, E, EchoRuntimeServices>,
    /**
     * Optional listeners that will be called when the effect produces a value
     * or errors. Only meant to be used by hosts that require side effects
     * when the effect produces a value or errors, otherwise use the render
     * method to render the different states of the effect.
     */
    _listeners?: Omit<StatusListener<A, E>, "initial">,
  ) {
    super(host, () => _effect, _listeners);
  }

  hostConnected(): void {
    this.run();
  }
}
