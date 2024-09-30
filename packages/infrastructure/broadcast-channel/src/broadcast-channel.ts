import {
  MediaProviderMainThreadBroadcastChannel,
  MediaProviderWorkerBroadcastChannel,
  Crypto,
  type BroadcastChannel as TBroadcastChannel,
  type Guid,
  type Schema,
  type ChannelName,
} from "@echo/core-types";
import { Effect, Layer, Ref, Stream } from "effect";

type Request<
  TSchema extends Schema["actions"],
  TActionId extends keyof TSchema,
> = {
  identifier: Guid;
  actionId: TActionId;
  input: Parameters<TSchema["actions"][TActionId]>;
};

const createRequest = <
  TSchema extends Schema["actions"],
  TActionId extends keyof TSchema,
>(
  correlationId: Guid,
  actionId: TActionId,
  input: TSchema[TActionId],
): Request<TSchema, TActionId> => ({
  identifier: correlationId,
  actionId,
  input,
});

const createBroadcastChannel = <TSchema extends Schema>(
  channelName: ChannelName,
) =>
  Effect.gen(function* () {
    const crypto = yield* Crypto;
    const _broadcastChannel: Ref.Ref<BroadcastChannel> = yield* Ref.make(
      new BroadcastChannel(channelName),
    );

    return {
      send: (actionId, input) =>
        Effect.gen(function* () {
          const correlationId = yield* crypto.generateUuid;
          const request = createRequest(correlationId, actionId, input);
          const channel = yield* _broadcastChannel.get;

          yield* Effect.log(
            `Sending request for action ${String(actionId)} with correlation ${correlationId}`,
          );

          return yield* Effect.sync(() => {
            channel.postMessage(request);
          });
        }),
      registerResolver: (actionId, resolver) =>
        Effect.forkDaemon(
          Effect.gen(function* () {
            const channel = yield* _broadcastChannel.get;

            yield* Effect.log(
              `Registering resolver for action ${String(actionId)}`,
            );

            return yield* Stream.fromEventListener<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              MessageEvent<Request<any, any>>
            >(channel, "message").pipe(
              Stream.filter((event) => event.data.actionId === actionId),
              Stream.tap((event) =>
                Effect.log(
                  `Received request for action ${event.data.actionId} with correlation ${event.data.identifier}`,
                ),
              ),
              Stream.runForEach((event) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolver(event.data.input as any),
              ),
            );
          }),
        ),
    } as TBroadcastChannel<TSchema>;
  });

/**
 * Implementations of the main thread and worker broadcast channels that can be
 * used to communicate with the media provider.
 */
export const MediaProviderMainThreadBroadcastChannelLive = Layer.effect(
  MediaProviderMainThreadBroadcastChannel,
  createBroadcastChannel("mediaProvider"),
);
export const MediaProviderWorkerBroadcastChannelLive = Layer.effect(
  MediaProviderWorkerBroadcastChannel,
  createBroadcastChannel("mediaProvider"),
);
