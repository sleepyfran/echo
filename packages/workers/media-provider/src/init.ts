import { MediaProviderWorkerBroadcastChannel } from "@echo/core-types";
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

    const workerStateRef = yield* WorkerStateRef;
    const broadcastChannel = yield* MediaProviderWorkerBroadcastChannel;

    const startResolverFiber = yield* broadcastChannel.registerResolver(
      "start",
      (input) =>
        startMediaProviderResolver({
          broadcastChannel: broadcastChannel,
          input,
          workerStateRef,
        }),
    );

    const stopResolverFiber = yield* broadcastChannel.registerResolver(
      "stop",
      (_input) => Effect.succeed(() => {}),
    );

    yield* Effect.log(
      "Media provider worker initialized, awaiting resolving fibers.",
    );
    Fiber.joinAll([startResolverFiber, stopResolverFiber]);
  });
