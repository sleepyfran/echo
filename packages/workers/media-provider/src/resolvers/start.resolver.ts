import {
  ProviderError,
  MetadataProvider,
  Database,
  Crypto,
  ProviderStartArgs,
  ProviderType,
  type FileBasedProvider,
  type ApiBasedProvider,
  type IBroadcaster,
  ProviderStatusChanged,
} from "@echo/core-types";
import { LazyLoadedProvider } from "@echo/services-bootstrap";
import { DateTime, Effect, Match, Option, Ref } from "effect";
import type { WorkerState } from "../state";
import { isValidToken } from "@echo/core-auth";
import { syncFileBasedProvider } from "../sync/file-based-sync";
import { syncApiBasedProvider } from "../sync/api-based-sync";

type StartMediaProviderResolverInput = {
  input: ProviderStartArgs;
  broadcaster: IBroadcaster;
  workerStateRef: Ref.Ref<WorkerState>;
};

export const startMediaProviderResolver = ({
  broadcaster,
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

    if (Option.isSome(input.lastSyncedAt)) {
      const lastSyncDate = DateTime.unsafeFromDate(input.lastSyncedAt.value);
      const aDayAgo = DateTime.unsafeNow().pipe(
        DateTime.subtractDuration("1 day"),
      );

      const lessThanADayAgo = aDayAgo.pipe(DateTime.greaterThan(lastSyncDate));
      if (lessThanADayAgo) {
        yield* Effect.log(
          `Provider with ID ${input.metadata.id} was synced less than a day ago. Ignoring command.`,
        );
        return;
      }
    }

    if (!isValidToken(input.authInfo)) {
      yield* Effect.logError(
        `Token for provider with ID ${input.metadata.id} is expired. Aborting initialization.`,
      );
      yield* notifyMainThreadOfExpiredToken(input, broadcaster);
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

    const runtimeFiber = yield* Match.type<ProviderStartArgs>().pipe(
      Match.tag(ProviderType.FileBased, (input) =>
        Effect.fork(
          syncFileBasedProvider({
            startArgs: input,
            broadcaster,
            metadataProvider,
            /*
            Provider loader guarantees this.
            FIXME: Can we type this better?
            */
            provider: mediaProvider as FileBasedProvider,
            rootFolder: input.rootFolder,
            database,
            crypto,
          }),
        ),
      ),
      Match.tag(ProviderType.ApiBased, (input) =>
        Effect.fork(
          syncApiBasedProvider({
            startArgs: input,
            broadcaster,
            /*
            Provider loader guarantees this.
            FIXME: Can we type this better?
            */
            provider: mediaProvider as ApiBasedProvider,
            database,
          }),
        ),
      ),
      Match.exhaustive,
    )(input);

    yield* Ref.update(workerStateRef, (state) => {
      const updatedMap = new Map(state.fiberByProvider);
      updatedMap.set(input.metadata.id, runtimeFiber);
      return { ...state, fiberByProvider: updatedMap };
    });
  });

export const notifyMainThreadOfExpiredToken = (
  startArgs: ProviderStartArgs,
  broadcaster: IBroadcaster,
) =>
  Effect.gen(function* () {
    return yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs,
        status: { _tag: "errored", error: ProviderError.TokenExpired },
      }),
    );
  });
