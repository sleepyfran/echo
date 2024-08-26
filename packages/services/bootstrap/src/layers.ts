import { Layer, Logger } from "effect";
import {
  MediaProviderMainThreadBroadcastChannelLive,
  MediaProviderWorkerBroadcastChannelLive,
} from "@echo/infrastructure-broadcast-channel";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { DexieDatabaseLive } from "@echo/infrastructure-dexie-database";
import { MmbMetadataProviderLive } from "@echo/infrastructure-mmb-metadata-provider";
import { LazyLoadedProviderLive } from "./loaders/provider";
import { AppConfigLive } from "./app-config";
import { LazyLoadedMediaPlayerLive } from "./loaders/player";
import { ActiveMediaProviderCacheLive } from "@echo/services-active-media-provider-cache";
import { MediaProviderStatusLive } from "@echo/services-media-provider-status";
import { BrowserLocalStorageLive } from "@echo/infrastructure-browser-local-storage";

/**
 * Exports a layer that can provide all dependencies that are needed in the
 * main thread (web-app).
 */
export const MainLive = ActiveMediaProviderCacheLive.pipe(
  Layer.provideMerge(MediaProviderStatusLive),
  Layer.provideMerge(MediaProviderMainThreadBroadcastChannelLive),
  Layer.provideMerge(MediaProviderWorkerBroadcastChannelLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(LazyLoadedMediaPlayerLive),
  Layer.provideMerge(BrowserLocalStorageLive),
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(DexieDatabaseLive),
  Layer.provideMerge(AppConfigLive),
  Layer.provide(Logger.pretty),
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
  Layer.provide(Logger.pretty),
);
