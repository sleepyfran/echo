import * as S from "@effect/schema/Schema";
import type { Effect, Request, Stream } from "effect";

/**
 * Defines all available channels.
 */
export type ChannelName = "mediaProvider";

/**
 * Defines a service that can act as the main message hub of the application,
 * across the main process and all worker threads.
 */
export type Broadcaster = {
  /**
   * Broadcasts the given request to the specified channel, without waiting for
   * a response.
   */
  broadcast: <TRequest extends S.TaggedRequest.All>(
    channel: ChannelName,
    request: TRequest,
  ) => Effect.Effect<
    Request.Request.Success<TRequest>,
    Request.Request.Error<TRequest>
  >;
};

/**
 * Defines a listener that can listen to messages broadcasted to a specific
 * channel.
 */
export type BroadcastListener = {
  /**
   * Listens to messages broadcasted to the specified channel and populates
   * a stream that emits the received messages as they arrive.
   */
  listen: <TRequest extends S.TaggedRequest.All>(
    channel: ChannelName,
    request: TRequest,
  ) => Stream.Stream<
    Request.Request.Success<TRequest>,
    Request.Request.Error<TRequest>
  >;
};
