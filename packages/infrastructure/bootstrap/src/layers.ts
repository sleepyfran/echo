import { Layer } from "effect";
import { BroadcastChannelLive } from "@echo/infrastructure-broadcast-channel";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { MmbMetadataProviderLive } from "@echo/infrastructure-mmb-metadata-provider";
import { LazyLoadedProviderLive } from "./loaders/provider";
import { AppConfigLive } from "./app-config";

/**
 * Exports a layer that can provide all dependencies that are needed in the
 * main thread (web-app).
 */
export const MainLive = BroadcastChannelLive.pipe(
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(AppConfigLive),
);

/**
 * Exports a layer that can provide all dependencies that are needed in a
 * web worker.
 */
export const WorkerLive = BroadcastChannelLive.pipe(
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(MmbMetadataProviderLive),
  Layer.provideMerge(AppConfigLive),
);
