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
import { DateTime, Effect, Fiber, Match, Option, Ref } from "effect";
import type { WorkerState } from "../state";
import { isValidToken } from "@echo/core-auth";
import { syncFileBasedProvider } from "../sync/file-based-sync";
import { syncApiBasedProvider } from "../sync/api-based-sync";
import type { ParseError } from "effect/ParseResult";

export type ForkSyncMediaProviderInput = {
  input: ProviderStartArgs;
  broadcaster: IBroadcaster;
  workerStateRef: Ref.Ref<WorkerState>;
  force: boolean;
};

export const forkSync = ({
  broadcaster,
  input,
  workerStateRef,
  force,
}: ForkSyncMediaProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Attempting to sync media provider ${input.metadata.id}`);

    const currentWorkerState = yield* workerStateRef.get;
    const providerSyncState = currentWorkerState.stateByProvider.get(
      input.metadata.id,
    );
    if (providerSyncState && Option.isSome(providerSyncState.fiber)) {
      const fiberStatus = yield* providerSyncState.fiber.value.status;
      if (fiberStatus._tag === "Running") {
        yield* Effect.log(
          `Provider with ID ${input.metadata.id} is already syncing. Ignoring command.`,
        );
        return;
      }
    }

    if (!force && Option.isSome(input.lastSyncedAt)) {
      const lastSyncDate = DateTime.unsafeFromDate(input.lastSyncedAt.value);
      const aDayAgo = DateTime.unsafeNow().pipe(
        DateTime.subtractDuration("1 day"),
      );

      const lessThanADayAgo = aDayAgo.pipe(DateTime.lessThan(lastSyncDate));
      if (lessThanADayAgo) {
        yield* Effect.log(
          `Provider with ID ${input.metadata.id} was synced less than a day ago. Ignoring command.`,
        );
        yield* updateStateInWorkerMap(workerStateRef, input);
        yield* notifyMainThreadOfSyncSkipped(
          input,
          input.lastSyncedAt.value,
          broadcaster,
        );
        return;
      }
    }

    if (!isValidToken(input.authInfo)) {
      yield* Effect.logError(
        `Token for provider with ID ${input.metadata.id} is expired. Aborting initialization.`,
      );
      yield* updateStateInWorkerMap(workerStateRef, input);
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

    yield* updateStateInWorkerMap(
      workerStateRef,
      input,
      Option.some(runtimeFiber),
    );
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

export const notifyMainThreadOfSyncSkipped = (
  startArgs: ProviderStartArgs,
  lastSyncDate: Date,
  broadcaster: IBroadcaster,
) =>
  broadcaster.broadcast(
    "mediaProvider",
    new ProviderStatusChanged({
      startArgs,
      status: { _tag: "sync-skipped", lastSyncedAt: lastSyncDate },
    }),
  );

export const updateStateInWorkerMap = (
  workerStateRef: Ref.Ref<WorkerState>,
  startArgs: ProviderStartArgs,
  fiber: Option.Option<Fiber.RuntimeFiber<void, ParseError>> = Option.none(),
) =>
  Ref.update(workerStateRef, (state) => {
    const updatedMap = new Map(state.stateByProvider);
    updatedMap.set(startArgs.metadata.id, {
      startArgs,
      fiber,
    });
    return { ...state, stateByProvider: updatedMap };
  });
