import { Layer } from "effect";
import {
  MediaProviderMainThreadBroadcastChannelLive,
  MediaProviderWorkerBroadcastChannelLive,
} from "@echo/infrastructure-broadcast-channel";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { DexieDatabaseLive } from "@echo/infrastructure-dexie-database";
import { LibraryLive } from "@echo/services-library";
import { MmbMetadataProviderLive } from "@echo/infrastructure-mmb-metadata-provider";
import { LazyLoadedProviderLive } from "./loaders/provider";
import { AppConfigLive } from "./app-config";
import { PlayerLive } from "@echo/services-player";

/**
 * Exports a layer that can provide all dependencies that are needed in the
 * main thread (web-app).
 */
export const MainLive = MediaProviderMainThreadBroadcastChannelLive.pipe(
  Layer.provideMerge(MediaProviderWorkerBroadcastChannelLive),
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(PlayerLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(LibraryLive),
  Layer.provideMerge(DexieDatabaseLive),
  Layer.provideMerge(AppConfigLive),
);

/**
 * Exports a layer that can provide all dependencies that are needed in a
 * web worker.
 */
export const WorkerLive = MediaProviderMainThreadBroadcastChannelLive.pipe(
  Layer.provideMerge(MediaProviderWorkerBroadcastChannelLive),
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(DexieDatabaseLive),
  Layer.provideMerge(MmbMetadataProviderLive),
  Layer.provideMerge(AppConfigLive),
);
