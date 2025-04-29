import {
  Broadcaster,
  BroadcastListener,
  ForceSyncProvider,
  StartProvider,
  StopProvider,
} from "@echo/core-types";
import { Effect, Stream } from "effect";
import { startMediaProviderResolver } from "./resolvers/start.resolver";
import * as S from "@effect/schema/Schema";
import { WorkerStateRef } from "./state";
import { stopMediaProviderResolver } from "./resolvers/stop.resolver";
import { forkSync } from "./sync/sync";

export const InitMessage = S.TaggedStruct("init", {});
type InitMessage = S.Schema.Type<typeof InitMessage>;

export const InitFinishedMessage = S.TaggedStruct("initFinished", {});
type InitFinishedMessage = S.Schema.Type<typeof InitFinishedMessage>;

/**
 * Initializes the media provider worker, which sets up itself to resolve
 * media provider messages from the main thread.
 */
export const init = () =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing media provider worker...");

    const workerStateRef = yield* WorkerStateRef;
    const broadcaster = yield* Broadcaster;
    const broadcastListener = yield* BroadcastListener;

    const startStream = yield* broadcastListener.listen(
      "mediaProvider",
      StartProvider,
    );
    yield* startStream.pipe(
      Stream.runForEach((request) =>
        startMediaProviderResolver({
          broadcaster,
          input: request.args,
          workerStateRef,
        }),
      ),
      Effect.forkScoped,
    );

    const forceSyncStream = yield* broadcastListener.listen(
      "mediaProvider",
      ForceSyncProvider,
    );
    yield* forceSyncStream.pipe(
      Stream.runForEach((request) =>
        forkSync({
          broadcaster,
          input: request.args,
          workerStateRef,
          force: true,
        }),
      ),
      Effect.forkScoped,
    );

    const stopStream = yield* broadcastListener.listen(
      "mediaProvider",
      StopProvider,
    );
    yield* stopStream.pipe(
      Stream.runForEach((request) =>
        stopMediaProviderResolver({
          providerId: request.provider.id,
          broadcaster,
          workerStateRef,
        }),
      ),
      Effect.forkScoped,
    );

    yield* Effect.log(
      "Media provider worker initialized, awaiting resolving fibers.",
    );

    yield* Effect.sync(() => self.postMessage(InitFinishedMessage.make({})));
  });
