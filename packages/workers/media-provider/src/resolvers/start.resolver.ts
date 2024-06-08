import {
  AppConfig,
  ProviderError,
  type MainThreadToMediaProviderBroadcastSchema,
  type MediaProviderWorkerToMainThreadBroadcastSchema,
  type ProviderMetadata,
  type BroadcastChannel,
} from "@echo/core-types";
import {
  lazyLoadMetadataProvider,
  lazyLoadProviderFromMetadata,
} from "@echo/infrastructure-bootstrap";
import { Console, Effect, Layer, Match, Ref } from "effect";
import type { WorkerState } from "../state";
import { isValidToken } from "@echo/core-auth";
import { syncFileBasedProvider } from "../sync/file-based-sync";

type StartMediaProviderResolverInput = {
  input: MainThreadToMediaProviderBroadcastSchema["start"];
  broadcastChannel: BroadcastChannel<MediaProviderWorkerToMainThreadBroadcastSchema>;
  workerStateRef: Ref.Ref<WorkerState>;
  appConfigLayer: Layer.Layer<AppConfig>;
};

export const startMediaProviderResolver = ({
  appConfigLayer,
  broadcastChannel,
  input,
  workerStateRef,
}: StartMediaProviderResolverInput) =>
  Effect.gen(function* () {
    yield* Console.log(`Starting media provider ${input.metadata.id}`);

    const currentWorkerState = yield* workerStateRef.get;
    const alreadyStarted = currentWorkerState.fiberByProvider.has(
      input.metadata.id,
    );

    if (alreadyStarted) {
      yield* Console.log(
        `Provider with ID ${input.metadata.id} is already started. Ignoring command.`,
      );
      return;
    }

    if (!isValidToken(input.authInfo)) {
      yield* Console.error(
        `Token for provider with ID ${input.metadata.id} is expired. Aborting initialization.`,
      );
      yield* notifyMainThreadOfExpiredToken(broadcastChannel, input.metadata);
      return;
    }

    yield* Console.log(
      `Starting provider with ID ${input.metadata.id} and type ${input.metadata.type}.`,
    );

    const { createMediaProvider } = yield* lazyLoadProviderFromMetadata(
      input.metadata,
      appConfigLayer,
    );
    const mediaProvider = createMediaProvider(input.authInfo);
    const metadataProvider = yield* lazyLoadMetadataProvider;

    const runtimeFiber = yield* Match.type<
      MainThreadToMediaProviderBroadcastSchema["start"]
    >().pipe(
      Match.tag("file-based", (input) =>
        Effect.fork(
          syncFileBasedProvider({
            broadcastChannel,
            metadata: input.metadata,
            metadataProvider,
            provider: mediaProvider,
            rootFolder: input.rootFolder,
          }),
        ),
      ),
      Match.tag("api-based", (_input) => Effect.fork(Effect.void)),
      Match.exhaustive,
    )(input);

    yield* Ref.update(workerStateRef, (state) => {
      const updatedMap = new Map(state.fiberByProvider);
      updatedMap.set(input.metadata.id, runtimeFiber);
      return { ...state, fiberByProvider: updatedMap };
    });
  });

export const notifyMainThreadOfExpiredToken = (
  broadcastChannel: BroadcastChannel<MediaProviderWorkerToMainThreadBroadcastSchema>,
  metadata: ProviderMetadata,
) =>
  Effect.gen(function* () {
    return yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: { _tag: "errored", error: ProviderError.TokenExpired },
    });
  });
