import { Effect, Layer, Option } from "effect";
import {
  ActiveMediaProviderCache,
  Broadcaster,
  Database,
  LocalStorage,
  MediaProviderManager,
  StopProvider,
} from "@echo/core-types";

export const MediaProviderManagerLive = Layer.scoped(
  MediaProviderManager,
  Effect.gen(function* () {
    const activeMediaProviderCache = yield* ActiveMediaProviderCache;
    const broadcaster = yield* Broadcaster;
    const database = yield* Database;
    const localStorage = yield* LocalStorage;

    return MediaProviderManager.of({
      signOut: (providerId) =>
        Effect.gen(function* () {
          const providerWithMetadata =
            yield* activeMediaProviderCache.get(providerId);

          if (Option.isNone(providerWithMetadata)) {
            yield* Effect.logWarning(
              `Requested to sign out from provider ${providerId}, but it is not active. Ignoring request...`,
            );
            return;
          }

          const { player, metadata } = providerWithMetadata.value;

          // Stop the syncing engine.
          yield* broadcaster.broadcast(
            "mediaProvider",
            new StopProvider({
              provider: metadata,
            }),
          );

          // Stop the media player.
          yield* player.dispose;

          // Clear authentication info and log-out.
          yield* localStorage.remove("media-provider-start-args", metadata.id);

          // Cleanup albums with this providerId.
          const albumsTable = yield* database.table("albums");
          yield* albumsTable.deleteMany("providerId", providerId);

          // TODO: Cleanup artists with no albums.
        }).pipe(
          // TODO: Maybe propagate the error and show a notification?
          Effect.catchAll((error) =>
            Effect.logError(
              `Failed to sign out from provider ${providerId}: ${error}`,
            ),
          ),
        ),
    });
  }),
);
