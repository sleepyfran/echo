import {
  BroadcastChannelFactory,
  Crypto,
  type Guid,
  type Schema,
} from "@echo/core-types";
import { Console, Effect, Layer, Ref, Stream } from "effect";

type Request<TSchema extends Schema, TActionId extends keyof TSchema> = {
  identifier: Guid;
  actionId: TActionId;
  input: Parameters<TSchema[TActionId]>;
};

const createRequest = <TSchema extends Schema, TActionId extends keyof TSchema>(
  correlationId: Guid,
  actionId: TActionId,
  input: TSchema[TActionId],
): Request<TSchema, TActionId> => ({
  identifier: correlationId,
  actionId,
  input,
});

/**
 * Implementations of the broadcast channel that uses the BroadcastChannel API
 * to send and receive messages.
 */
export const BroadcastChannelLive = Layer.effect(
  BroadcastChannelFactory,
  Effect.gen(function* () {
    const crypto = yield* Crypto;

    return BroadcastChannelFactory.of({
      create: (channelName) =>
        Effect.gen(function* () {
          const _broadcastChannel: Ref.Ref<BroadcastChannel> = yield* Ref.make(
            new BroadcastChannel(channelName),
          );

          return {
            send: (actionId, input) =>
              Effect.gen(function* () {
                const correlationId = yield* crypto.generateUuid;
                const request = createRequest(correlationId, actionId, input);
                const channel = yield* _broadcastChannel.get;

                return yield* Effect.sync(() => {
                  channel.postMessage(request);
                });
              }),
            registerResolver: (actionId, resolver) =>
              Effect.fork(
                Effect.gen(function* () {
                  const channel = yield* _broadcastChannel.get;

                  return yield* Stream.fromEventListener<
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    MessageEvent<Request<any, any>>
                  >(channel, "message").pipe(
                    Stream.tap((event) =>
                      Console.log(
                        `Received request for action ${event.data.actionId} with correlation ${event.data.identifier}`,
                      ),
                    ),
                    Stream.filter((event) => event.data.actionId === actionId),
                    Stream.runForEach((event) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      resolver(event.data.input as any),
                    ),
                  );
                }),
              ),
          };
        }),
    });
  }),
);
