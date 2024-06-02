import { Context, Effect, Fiber, Scope } from "effect";
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
   * Registers a resolver for a specific action and processes the messages in
   * the background. Returns an effect that produces a fiber that can be used
   * to interrupt the resolver, essentially stopping the processing of messages.
   */
  registerResolver<TActionId extends keyof TSchema>(
    actionId: TActionId,
    resolver: (input: TSchema[TActionId]) => Effect.Effect<void>,
  ): Effect.Effect<Fiber.RuntimeFiber<void>>;
};

/**
 * Defines all the possible broadcast channel names that can be used in the
 * typed broadcast channel.
 */
export enum BroadcastChannelName {
  MediaProvider = "media-provider",
}

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
      channelName: BroadcastChannelName,
    ) => Effect.Effect<BroadcastChannel<TSchema>, never, Scope.Scope>;
  }
>() {}
