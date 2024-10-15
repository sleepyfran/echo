import {
  LocalStorage,
  MediaProviderArgsStorage,
  BroadcastListener,
  ProviderStartArgs,
  ProviderStatusChanged,
} from "@echo/core-types";
import { Effect, Layer, Match, Option, Stream } from "effect";

/**
 * Implementation of the media provider args storage service that uses the
 * local storage as the underlying storage.
 */
export const MediaProviderArgStorageLive = Layer.effect(
  MediaProviderArgsStorage,
  Effect.gen(function* () {
    const broadcastChannel = yield* BroadcastListener;
    const localStorage = yield* LocalStorage;

    return MediaProviderArgsStorage.of({
      keepInSync: broadcastChannel
        .listen("mediaProvider", ProviderStatusChanged)
        .pipe(
          Effect.map(
            Stream.runForEach(({ status, startArgs }) =>
              Match.value(status).pipe(
                Match.tag("synced", ({ lastSyncedAt }) =>
                  localStorage.set(
                    "media-provider-start-args",
                    startArgs.metadata.id,
                    ProviderStartArgs,
                    {
                      ...startArgs,
                      lastSyncedAt: Option.some(lastSyncedAt),
                    } satisfies ProviderStartArgs,
                  ),
                ),
                Match.orElse(() => Effect.void),
              ),
            ),
          ),
        ),
    });
  }),
);
