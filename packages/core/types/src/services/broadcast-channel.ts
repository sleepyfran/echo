import { Context, Effect, Fiber } from "effect";
import type { MediaProviderBroadcastSchema, Schema } from "../broadcast";

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
  send<TActionId extends keyof TSchema["actions"]>(
    actionId: TActionId,
    input: TSchema["actions"][TActionId],
  ): Effect.Effect<void>;

  /**
   * Registers a resolver for a specific action and processes the messages in
   * the background. Returns an effect that produces a fiber that can be used
   * to interrupt the resolver, essentially stopping the processing of messages.
   */
  registerResolver<TActionId extends keyof TSchema["resolvers"], TRequirements>(
    actionId: TActionId,
    resolver: (
      input: TSchema["resolvers"][TActionId],
    ) => Effect.Effect<void, never, TRequirements>,
  ): Effect.Effect<Fiber.RuntimeFiber<void>, never, TRequirements>;
};

/**
 * Defines all the possible broadcast channel names that can be used in the
 * typed broadcast channel.
 */
export enum BroadcastChannelName {
  MediaProvider = "media-provider",
}

/**
 * A broadcast channel that can be used from the main thread to communicate
 * with a media provider worker.
 */
export class MediaProviderMainThreadBroadcastChannel extends Context.Tag(
  "@echo/core-types/MediaProviderMainThreadBroadcastChannelFactory",
)<
  MediaProviderMainThreadBroadcastChannel,
  BroadcastChannel<MediaProviderBroadcastSchema["mainThread"]>
>() {}

/**
 * A broadcast channel that can be used from a media provider worker to
 * communicate with the main thread.
 */
export class MediaProviderWorkerBroadcastChannel extends Context.Tag(
  "@echo/core-types/MediaProviderWorkerBroadcastChannelFactory",
)<
  MediaProviderWorkerBroadcastChannel,
  BroadcastChannel<MediaProviderBroadcastSchema["worker"]>
>() {}
