import {
  Broadcaster,
  BroadcastListener,
  type ChannelName,
} from "@echo/core-types";
import * as S from "effect/Schema";
import { Effect, Layer, Stream } from "effect";

const createChannel = (channelName: ChannelName) =>
  Effect.acquireRelease(
    Effect.sync(() => new BroadcastChannel(channelName)),
    (channel) => Effect.sync(() => channel.close()),
  );

const makeBroadcaster = Broadcaster.of({
  broadcast: (channel, value) =>
    Effect.gen(function* () {
      const broadcastChannel = yield* createChannel(channel);
      const serializedRequest = yield* S.serialize(value).pipe(
        Effect.tapError((error) =>
          Effect.logError(
            "An error happened while serializing the value:",
            error,
          ),
        ),
      );

      yield* Effect.sync(() => broadcastChannel.postMessage(serializedRequest));
    }).pipe(Effect.scoped),
});

/**
 * A layer that provides a broadcaster that broadcasts messages through the
 * Broadcast Channel API.
 */
export const BroadcasterLive = Layer.succeed(Broadcaster, makeBroadcaster);

const makeBroadcastListener = BroadcastListener.of({
  listen: (channel, schema) =>
    Effect.gen(function* () {
      yield* Effect.log(
        `Starting to listen to channel ${channel} for schema ${schema}`,
      );

      const broadcastChannel = yield* createChannel(channel);
      const decode = S.decodeUnknownSync(schema);

      return Stream.asyncPush((emit) => {
        const messageHandler = (message: MessageEvent) => {
          try {
            const decoded = decode(message.data);
            emit.single(decoded);
          } catch {
            return;
          }
        };

        return Effect.acquireRelease(
          Effect.sync(() =>
            broadcastChannel.addEventListener("message", messageHandler),
          ),
          () =>
            Effect.sync(() =>
              broadcastChannel.removeEventListener("message", messageHandler),
            ),
        );
      });
    }),
});

/**
 * A layer that provides a broadcast listener that listens to messages
 * through the Broadcast Channel API.
 */
export const BroadcastListenerLive = Layer.succeed(
  BroadcastListener,
  makeBroadcastListener,
);
