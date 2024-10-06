import {
  LocalStorage,
  MediaProviderArgsStorage,
  MediaProviderMainThreadBroadcastChannel,
} from "@echo/core-types";
import { Effect, Layer, Match, Option } from "effect";

/**
 * Implementation of the media provider args storage service that uses the
 * local storage as the underlying storage.
 */
export const MediaProviderArgStorageLive = Layer.effect(
  MediaProviderArgsStorage,
  Effect.gen(function* () {
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;
    const localStorage = yield* LocalStorage;

    return MediaProviderArgsStorage.of({
      keepInSync: broadcastChannel.registerResolver(
        "reportStatus",
        ({ status, startArgs }) =>
          Match.value(status).pipe(
            Match.tag("synced", ({ lastSyncedAt }) =>
              localStorage.set(
                "media-provider-start-args",
                startArgs.metadata.id,
                {
                  ...startArgs,
                  lastSyncedAt: Option.some(lastSyncedAt),
                },
              ),
            ),
            Match.orElse(() => Effect.void),
          ),
      ),
    });
  }),
);
