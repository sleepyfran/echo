import * as S from "effect/Schema";
import { Context, Scope, type Effect, type Stream } from "effect";

/**
 * Defines all available channels.
 */
export type ChannelName = "mediaProvider" | "authentication";

/**
 * Defines a service that can act as the main message hub of the application,
 * across the main process and all worker threads.
 */
export type IBroadcaster = {
  /**
   * Broadcasts the given request to the specified channel, without waiting for
   * a response.
   */
  broadcast: <TValue, TEncoded>(
    channel: ChannelName,
    schema: S.Codec<TValue, TEncoded>,
    value: TValue,
  ) => Effect.Effect<void, S.SchemaError>;
};

/**
 * Tag identifying the broadcaster service.
 */
export class Broadcaster extends Context.Service<Broadcaster, IBroadcaster>()(
  "@echo/core-types/Broadcaster",
) {}

/**
 * Defines a listener that can listen to messages broadcasted to a specific
 * channel.
 */
export type IBroadcastListener = {
  /**
   * Listens to messages broadcasted to the specified channel and populates
   * a stream that emits the received messages as they arrive.
   */
  listen: <TValue, TEncoded>(
    channel: ChannelName,
    schema: S.Codec<TValue, TEncoded>,
  ) => Effect.Effect<Stream.Stream<TValue>, never, Scope.Scope>;
};

/**
 * Tag to identify the broadcast listener service.
 */
export class BroadcastListener extends Context.Service<
  BroadcastListener,
  IBroadcastListener
>()("@echo/core-types/BroadcastListener") {}
