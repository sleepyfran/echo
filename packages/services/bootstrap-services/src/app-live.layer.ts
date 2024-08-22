import { ActiveMediaProviderCacheLive } from "@echo/services-active-media-provider-cache";
import { MediaProviderStatusLive } from "@echo/services-media-provider-status";
import { MainLive } from "@echo/services-bootstrap";
import { Layer } from "effect";

/**
 * Main layer to be used in the app thread that includes all infrastructure
 * dependencies of the main layer and a set of core services that should only
 * be initialized once.
 */
export const AppLive = Layer.mergeAll(
  ActiveMediaProviderCacheLive,
  MediaProviderStatusLive,
).pipe(Layer.provideMerge(MainLive));
