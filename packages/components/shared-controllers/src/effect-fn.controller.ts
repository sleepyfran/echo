import {
  getOrCreateRuntime,
  type EchoRuntimeServices,
} from "@echo/services-bootstrap-runtime";
import { Effect } from "effect";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { StatusListener } from "./shared.interface";

type StreamStatus<A, E> =
  | { _tag: "Initial" }
  | { _tag: "Pending" }
  | { _tag: "Complete"; result: A }
  | { _tag: "Error"; error: E };

/**
 * Controller that takes a function that produces an effect and exposes a
 * method to execute the effect and render the different states of the effect.
 */
export class EffectFn<P, A, E> implements ReactiveController {
  private host: ReactiveControllerHost;
  private _status: StreamStatus<A, E> = { _tag: "Initial" };

  constructor(
    host: ReactiveControllerHost,
    private readonly _effectFn: (
      p: P,
    ) => Effect.Effect<A, E, EchoRuntimeServices>,
    /**
     * Optional listeners that will be called when the effect produces a value
     * or errors. Only meant to be used by hosts that require side effects
     * when the effect produces a value or errors, otherwise use the render
     * method to render the different states of the effect.
     */
    private readonly _listeners?: Omit<StatusListener<A, E>, "initial">,
  ) {
    (this.host = host).addController(this);
  }

  hostConnected(): void {}

  /**
   * Runs the effect with the given parameters. This produces a value or an error
   * that gets notified to the host and triggers the listeners if they are provided.
   */
  run(params: P) {
    const consumer = this._effectFn(params).pipe(
      Effect.tap((result) =>
        Effect.sync(() => this.handleUpdate$({ _tag: "Complete", result })),
      ),
      Effect.tapError((error) =>
        Effect.sync(() => this.handleUpdate$({ _tag: "Error", error })),
      ),
    );

    this.handleUpdate$({
      _tag: "Pending",
    });
    getOrCreateRuntime().runPromise(consumer);
  }

  /**
   * Maps the different states of the effect to a renderer.
   */
  render(renderer: StatusListener<A, E>) {
    switch (this._status._tag) {
      case "Initial":
        return renderer.initial?.();
      case "Pending":
        return renderer.pending?.();
      case "Complete":
        return renderer.complete?.(this._status.result);
      case "Error":
        return renderer.error?.(this._status.error);
    }
  }

  private handleUpdate$(state: StreamStatus<A, E>) {
    switch (state._tag) {
      case "Pending":
        this._listeners?.pending?.();
        break;
      case "Complete":
        this._listeners?.complete?.(state.result);
        break;
      case "Error":
        this._listeners?.error?.(state.error);
        break;
    }

    this._status = state;
    this.host.requestUpdate();
  }
}
