import { Context, Effect, Scope } from "effect";
import type { Schema } from "../broadcast";

/**
 * A typed broadcast channel that allows for sending requests and receiving
 * responses with a specific schema. This can be used to communicate between
 * the main thread and a web worker, or between two web workers.
 */
export type BroadcastChannel<TSchema extends Schema> = {
  /**
   * Sends a message to the channel for the specified action and input. It will
   * not wait for a response, and will not return any value.
   */
  send<TActionId extends keyof TSchema>(
    actionId: TActionId,
    input: TSchema[TActionId],
  ): Effect.Effect<void>;

  /**
   * Registers a resolver for a specific action. The resolver will be called
   * whenever a message is received in the channel for the specified action ID.
   */
  registerResolver<TActionId extends keyof TSchema>(
    actionId: TActionId,
    resolver: (input: TSchema[TActionId]) => Effect.Effect<void>,
  ): Effect.Effect<void>;
};

/**
 * A factory that can create new instances of a typed broadcast channel for
 * a given schema.
 */
export class BroadcastChannelFactory extends Context.Tag(
  "BroadcastChannelFactory",
)<
  BroadcastChannelFactory,
  {
    readonly create: <TSchema extends Schema>(
      channelName: string,
    ) => Effect.Effect<BroadcastChannel<TSchema>, never, Scope.Scope>;
  }
>() {}
