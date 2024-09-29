import type {
  ApiBasedProvider,
  BroadcastChannel,
  MediaProviderBroadcastSchema,
  ProviderMetadata,
} from "@echo/core-types";
import { Effect } from "effect";

type SyncApiBasedProviderInput = {
  metadata: ProviderMetadata;
  broadcastChannel: BroadcastChannel<MediaProviderBroadcastSchema["worker"]>;
  provider: ApiBasedProvider;
};

export const syncApiBasedProvider = ({
  metadata,
  broadcastChannel,
}: SyncApiBasedProviderInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Starting sync for provider ${metadata.id}`);

    yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: { _tag: "syncing" },
    });

    yield* broadcastChannel.send("reportStatus", {
      metadata,
      status: {
        _tag: "synced",
        filesWithError: 0,
        lastSyncedAt: new Date(),
        syncedFiles: 0,
      },
    });
  });
