import { Layer, Logger } from "effect";
import {
  BroadcastListenerLive,
  BroadcasterLive,
} from "@echo/infrastructure-browser-broadcast";
import { BrowserCryptoLive } from "@echo/infrastructure-browser-crypto";
import { DexieDatabaseLive } from "@echo/infrastructure-dexie-database";
import { MmbMetadataProviderLive } from "@echo/infrastructure-mmb-metadata-provider";
import { LazyLoadedProviderLive } from "./loaders/provider";
import { AppConfigLive } from "./app-config";
import { LazyLoadedMediaPlayerLive } from "./loaders/player";
import { ActiveMediaProviderCacheLive } from "@echo/services-active-media-provider-cache";
import {
  MediaProviderArgStorageLive,
  MediaProviderStatusLive,
} from "@echo/services-media-provider-status";
import { BrowserLocalStorageLive } from "@echo/infrastructure-browser-local-storage";
import { SpotifyArtistImageProvider } from "@echo/infrastructure-spotify-artist-image-provider";
import {
  AuthenticationCacheLive,
  AuthenticationRefresherLive,
} from "@echo/services-reauthentication";
import { MediaProviderManagerLive } from "@echo/services-media-provider-manager";

/**
 * Exports a layer that can provide all dependencies that are needed in the
 * main thread (web-app).
 */
export const MainLive = MediaProviderArgStorageLive.pipe(
  Layer.provideMerge(MediaProviderStatusLive),
  Layer.provideMerge(MediaProviderManagerLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(LazyLoadedMediaPlayerLive),
  Layer.provideMerge(AuthenticationRefresherLive),
  Layer.provideMerge(AuthenticationCacheLive),
  Layer.provideMerge(ActiveMediaProviderCacheLive),
  Layer.provideMerge(BroadcasterLive),
  Layer.provideMerge(BroadcastListenerLive),
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
export const WorkerLive = MediaProviderStatusLive.pipe(
  Layer.provideMerge(BroadcasterLive),
  Layer.provideMerge(BrowserCryptoLive),
  Layer.provideMerge(LazyLoadedProviderLive),
  Layer.provideMerge(AuthenticationCacheLive),
  Layer.provideMerge(BroadcastListenerLive),
  Layer.provideMerge(DexieDatabaseLive),
  Layer.provideMerge(MmbMetadataProviderLive),
  Layer.provideMerge(SpotifyArtistImageProvider),
  Layer.provideMerge(AppConfigLive),
  Layer.provide(Logger.pretty),
);
