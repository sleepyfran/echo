import {
  BroadcastChannelFactory,
  AppConfig,
  type MainThreadToMediaProviderBroadcastSchema,
  BroadcastChannelName,
  AppConfigSchema,
  type MediaProviderWorkerToMainThreadBroadcastSchema,
} from "@echo/core-types";
import { Console, Effect, Fiber, Layer } from "effect";
import { startMediaProviderResolver } from "./resolvers/start.resolver";
import * as S from "@effect/schema/Schema";
import { WorkerStateRef } from "./state";

export const InitMessage = S.TaggedStruct("init", {
  payload: S.Struct({
    appConfig: AppConfigSchema,
  }),
});
type InitMessage = S.Schema.Type<typeof InitMessage>;

export const initMessageDecoder = S.decode(InitMessage);
export const initMessageEncoder = S.encode(InitMessage);

/**
 * Initializes the media provider worker, which sets up itself to resolve
 * media provider messages from the main thread.
 */
export const init = (message: InitMessage) =>
  Effect.gen(function* () {
    yield* Console.log("Initializing media provider worker...");

    const { appConfig } = message.payload;
    const { create: createBroadcastChannel } = yield* BroadcastChannelFactory;
    const workerStateRef = yield* WorkerStateRef;

    const appConfigLayer = Layer.succeed(AppConfig, AppConfig.of(appConfig));

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
          appConfigLayer,
          broadcastChannel: broadcastChannelToMainThread,
          input,
          workerStateRef,
        }),
      );

    const stopResolverFiber = yield* mainThreadToWorkerChannel.registerResolver(
      "stop",
      (_input) => Effect.succeed(() => {}),
    );

    Fiber.joinAll([startResolverFiber, stopResolverFiber]);
  });
