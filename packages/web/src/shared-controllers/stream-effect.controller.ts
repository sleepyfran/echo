import {
  getOrCreateRuntime,
  type EchoRuntimeServices,
} from "@echo/services-bootstrap-runtime";
import { Effect, Fiber, Stream, type SubscriptionRef } from "effect";
import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Defines a renderer that can render each different status of a stream.
 */
export type StatusRenderer<A, E> = {
  /**
   * Called when the stream has not yet produced an item.
   */
  initial?: () => unknown;

  /**
   * Called when the stream produces an item.
   */
  item?: (item: A) => unknown;

  /**
   * Called when the stream finishes.
   */
  complete?: () => unknown;

  /**
   * Called when the stream errors.
   */
  error?: (error: E) => unknown;
};

type StreamStatus<A, E> =
  | { _tag: "Initial" }
  | { _tag: "Item"; item: A }
  | { _tag: "Complete" }
  | { _tag: "Error"; error: E };

const isSubscriptionRef = <A, E>(
  streamOrRef: Stream.Stream<A, E> | SubscriptionRef.SubscriptionRef<A>,
): streamOrRef is SubscriptionRef.SubscriptionRef<A> =>
  "changes" in streamOrRef;

type OutputEffect<A, E> = Effect.Effect<
  Stream.Stream<A, E> | SubscriptionRef.SubscriptionRef<A>,
  never,
  EchoRuntimeServices
>;

/**
 * Controller that takes an effect that produces a stream or a subscription ref
 * and exposes a render method that renders maps the different states of the
 * stream to a renderer.
 */
export class StreamConsumer<A, E> implements ReactiveController {
  private host: ReactiveControllerHost;

  private _fiber: Fiber.RuntimeFiber<void, E> | undefined;
  private _status: StreamStatus<A, E> = { _tag: "Initial" };

  constructor(
    host: ReactiveControllerHost,
    private readonly _streamEffect:
      | OutputEffect<A, E>
      | (() => OutputEffect<A, E>),
    private readonly _listeners?: Omit<StatusRenderer<A, E>, "initial">,
  ) {
    (this.host = host).addController(this);
  }

  hostConnected(): void {
    const streamEffect =
      typeof this._streamEffect === "function"
        ? this._streamEffect()
        : this._streamEffect;

    const consumer$ = streamEffect.pipe(
      Effect.flatMap((streamOrRef) => {
        const stream = isSubscriptionRef(streamOrRef)
          ? streamOrRef.changes
          : streamOrRef;
        return stream.pipe(
          Stream.tap((item) => this.handleUpdate$({ _tag: "Item", item })),
          Stream.tapError((error) =>
            this.handleUpdate$({ _tag: "Error", error }),
          ),
          Stream.runDrain,
        );
      }),
    );

    this._fiber = getOrCreateRuntime().runFork(consumer$);
  }

  hostDisconnected(): void {
    if (this._fiber) {
      getOrCreateRuntime().runFork(Fiber.interrupt(this._fiber));
      this._fiber = undefined;
    }
  }

  /**
   * Maps the different states of the stream to a renderer.
   */
  render(renderer: StatusRenderer<A, E>) {
    switch (this._status._tag) {
      case "Initial":
        return renderer.initial?.();
      case "Item":
        return renderer.item?.(this._status.item);
      case "Complete":
        return renderer.complete?.();
      case "Error":
        return renderer.error?.(this._status.error);
    }
  }

  private handleUpdate$(state: StreamStatus<A, E>) {
    return Effect.sync(() => {
      switch (state._tag) {
        case "Item":
          this._listeners?.item?.(state.item);
          break;
        case "Complete":
          this._listeners?.complete?.();
          break;
        case "Error":
          this._listeners?.error?.(state.error);
          break;
      }

      this._status = state;
      this.host.requestUpdate();
    });
  }
}
