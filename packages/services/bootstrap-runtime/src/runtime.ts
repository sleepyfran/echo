import { AddProviderWorkflowLive } from "@echo/services-add-provider-workflow";
import { AppInitLive } from "@echo/services-app-init";
import { MainLive } from "@echo/services-bootstrap";
import { LibraryLive } from "@echo/services-library";
import { PlayerLive } from "@echo/services-player";
import { Layer, ManagedRuntime } from "effect";

/**
 * Runtime for the application that exposes the services that can be used
 * from the UI layer.
 */
export const runtime =
  ManagedRuntime.make(
    Layer.mergeAll(AppInitLive, AddProviderWorkflowLive, LibraryLive).pipe(
      Layer.provideMerge(PlayerLive),
      Layer.provideMerge(MainLive),
    )
  );

/**
 * Type that represents the services that are available in the runtime.
 */
export type EchoRuntimeServices<TRuntime = typeof runtime> =
  TRuntime extends ManagedRuntime.ManagedRuntime<infer A, infer _R> ? A : never;
