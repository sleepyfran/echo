import {
  Broadcaster,
  BroadcastListener,
  type ChannelName,
} from "@echo/core-types";
import { Serializable } from "@effect/schema";
import * as S from "@effect/schema/Schema";
import { Effect, Either, Layer, Option, Ref, Stream } from "effect";

const broadcastChannelCache = Effect.gen(function* () {
  const _channels = yield* Ref.make<Map<ChannelName, BroadcastChannel>>(
    new Map(),
  );

  const getOrCreateChannel = (channelName: ChannelName) =>
    Effect.gen(function* () {
      const channels = yield* _channels.get;

      if (channels.has(channelName)) {
        return channels.get(channelName)!;
      }

      const channel = new BroadcastChannel(channelName);
      const updatedMap = new Map();
      updatedMap.set(channelName, channel);
      yield* Ref.set(_channels, updatedMap);

      return channel;
    });

  return { getOrCreateChannel };
});

const makeBroadcaster = Effect.gen(function* () {
  const { getOrCreateChannel } = yield* broadcastChannelCache;

  return Broadcaster.of({
    broadcast: (channel, value) =>
      Effect.gen(function* () {
        const broadcastChannel = yield* getOrCreateChannel(channel);
        const serializedRequest = yield* Serializable.serialize(value).pipe(
          Effect.tapError((error) =>
            Effect.logError(
              "An error happened while serializing the value:",
              error,
            ),
          ),
        );

        yield* Effect.log(
          `Broadcasting message to channel ${channel}: ${JSON.stringify(serializedRequest)}`,
        );

        yield* Effect.sync(() =>
          broadcastChannel.postMessage(serializedRequest),
        );
      }),
  });
});

/**
 * A layer that provides a broadcaster that broadcasts messages through the
 * Broadcast Channel API.
 */
export const BroadcasterLive = Layer.effect(Broadcaster, makeBroadcaster);

const makeBroadcastListener = Effect.gen(function* () {
  const { getOrCreateChannel } = yield* broadcastChannelCache;

  return BroadcastListener.of({
    listen: (channel, schema) =>
      Effect.gen(function* () {
        yield* Effect.log(
          `Starting to listen to channel ${channel} for schema ${schema}`,
        );

        const broadcastChannel = yield* getOrCreateChannel(channel);
        const decode = S.decodeUnknown(schema);

        return Stream.fromEventListener<MessageEvent<unknown>>(
          broadcastChannel,
          "message",
        ).pipe(
          Stream.tap((event) =>
            Effect.log(`Received message: ${JSON.stringify(event.data)}`),
          ),
          Stream.mapEffect((event) => decode(event.data)),
          Stream.tap((decoded) =>
            Effect.log(`Decoded message: ${JSON.stringify(decoded)}`),
          ),
          Stream.either,
          Stream.filterMap(
            Either.match({
              onLeft: () => Option.none(),
              onRight: (value) => Option.some(value),
            }),
          ),
        );
      }),
  });
});

/**
 * A layer that provides a broadcast listener that listens to messages
 * through the Broadcast Channel API.
 */
export const BroadcastListenerLive = Layer.effect(
  BroadcastListener,
  makeBroadcastListener,
);
