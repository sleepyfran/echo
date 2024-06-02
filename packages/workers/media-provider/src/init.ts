import {
  BroadcastChannelFactory,
  AppConfig,
  type MainThreadToMediaProviderBroadcast,
  BroadcastChannelName,
  AppConfigSchema,
} from "@echo/core-types";
import { Effect, Layer, Scope, Exit, Console, Fiber } from "effect";
import { startMediaProviderResolver } from "./resolvers/start.resolver";
import * as S from "@effect/schema/Schema";

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
    const { appConfig } = message.payload;
    const { create: createBroadcastChannel } = yield* BroadcastChannelFactory;

    const appConfigLayer = Layer.succeed(AppConfig, AppConfig.of(appConfig));

    const mainThreadToWorkerChannel =
      yield* createBroadcastChannel<MainThreadToMediaProviderBroadcast>(
        BroadcastChannelName.MediaProvider,
      );

    const fiberScope = yield* Scope.make();
    const startFiber = yield* mainThreadToWorkerChannel.registerResolver(
      "start",
      (input) =>
        startMediaProviderResolver(input).pipe(Effect.provide(appConfigLayer)),
    );

    const stopFiber = yield* mainThreadToWorkerChannel.registerResolver(
      "stop",
      (_input) =>
        Effect.gen(function* () {
          yield* Scope.close(
            fiberScope,
            Exit.succeed("Stopped all main thread to worker resolvers"),
          );
        }),
    );

    // Cleanup the fibers when the scope is closed.
    Scope.addFinalizer(
      fiberScope,
      Effect.gen(function* () {
        yield* Console.log("Cleaning up main thread to worker resolvers");
        yield* Fiber.interrupt(startFiber);
        yield* Fiber.interrupt(stopFiber);
      }),
    );
  });
