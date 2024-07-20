import {
  ProviderError,
  type ProviderMetadata,
  type BroadcastChannel,
  MetadataProvider,
  type MediaProviderBroadcastSchema,
  Database,
  Crypto,
} from "@echo/core-types";
import { LazyLoadedProvider } from "@echo/infrastructure-bootstrap";
import { Effect, Match, Ref } from "effect";
import type { WorkerState } from "../state";
import { isValidToken } from "@echo/core-auth";
import { syncFileBasedProvider } from "../sync/file-based-sync";

type Input = MediaProviderBroadcastSchema["worker"]["resolvers"]["start"];
type TBroadcastChannel = BroadcastChannel<
  MediaProviderBroadcastSchema["worker"]
>;
type StartMediaProviderResolverInput = {
  input: Input;
  broadcastChannel: TBroadcastChannel;
  workerStateRef: Ref.Ref<WorkerState>;
};

export const startMediaProviderResolver = ({
  broadcastChannel,
  input,
  workerStateRef,
}: StartMediaProviderResolverInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting media provider ${input.metadata.id}`);

    const currentWorkerState = yield* workerStateRef.get;
    const alreadyStarted = currentWorkerState.fiberByProvider.has(
      input.metadata.id,
    );

    if (alreadyStarted) {
      yield* Effect.log(
        `Provider with ID ${input.metadata.id} is already started. Ignoring command.`,
      );
      return;
    }

    if (!isValidToken(input.authInfo)) {
      yield* Effect.logError(
        `Token for provider with ID ${input.metadata.id} is expired. Aborting initialization.`,
      );
      yield* notifyMainThreadOfExpiredToken(broadcastChannel, input.metadata);
      return;
    }

    yield* Effect.log(
      `Starting provider with ID ${input.metadata.id} and type ${input.metadata.type}.`,
    );

    const lazyLoader = yield* LazyLoadedProvider;
    const { createMediaProvider } = yield* lazyLoader.load(input.metadata);
    const mediaProvider = createMediaProvider(input.authInfo);
    const metadataProvider = yield* MetadataProvider;
    const database = yield* Database;
    const crypto = yield* Crypto;

    const runtimeFiber = yield* Match.type<Input>().pipe(
      Match.tag("file-based", (input) =>
        Effect.fork(
          syncFileBasedProvider({
            broadcastChannel,
            metadata: input.metadata,
            metadataProvider,
            provider: mediaProvider,
            rootFolder: input.rootFolder,
            database,
            crypto,
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
  broadcastChannel: TBroadcastChannel,
  metadata: ProviderMetadata,
) =>
  Effect.gen(function* () {
    return yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: { _tag: "errored", error: ProviderError.TokenExpired },
    });
  });
