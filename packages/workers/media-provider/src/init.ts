import {
  BroadcastChannelFactory,
  type MainThreadToMediaProviderBroadcastSchema,
  BroadcastChannelName,
  type MediaProviderWorkerToMainThreadBroadcastSchema,
} from "@echo/core-types";
import { Effect, Fiber } from "effect";
import { startMediaProviderResolver } from "./resolvers/start.resolver";
import * as S from "@effect/schema/Schema";
import { WorkerStateRef } from "./state";

export const InitMessage = S.TaggedStruct("init", {});
type InitMessage = S.Schema.Type<typeof InitMessage>;

export const initMessageDecoder = S.decode(InitMessage);
export const initMessageEncoder = S.encode(InitMessage);

/**
 * Initializes the media provider worker, which sets up itself to resolve
 * media provider messages from the main thread.
 */
export const init = () =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing media provider worker...");

    const { create: createBroadcastChannel } = yield* BroadcastChannelFactory;
    const workerStateRef = yield* WorkerStateRef;

    const mainThreadToWorkerChannel =
      yield* createBroadcastChannel<MainThreadToMediaProviderBroadcastSchema>(
        BroadcastChannelName.MediaProvider,
      );

    const broadcastChannelToMainThread =
      yield* createBroadcastChannel<MediaProviderWorkerToMainThreadBroadcastSchema>(
        BroadcastChannelName.MediaProvider,
      );

    const startResolverFiber =
      yield* mainThreadToWorkerChannel.registerResolver("start", (input) =>
        startMediaProviderResolver({
          broadcastChannel: broadcastChannelToMainThread,
          input,
          workerStateRef,
        }),
      );

    const stopResolverFiber = yield* mainThreadToWorkerChannel.registerResolver(
      "stop",
      (_input) => Effect.succeed(() => {}),
    );

    yield* Effect.log(
      "Media provider worker initialized, awaiting resolving fibers.",
    );
    Fiber.joinAll([startResolverFiber, stopResolverFiber]);
  });
