import { AddProviderWorkflowLive } from "@echo/services-add-provider-workflow";
import { AppInitLive } from "@echo/services-app-init";
import { MainLive } from "@echo/services-bootstrap";
import { Layer, ManagedRuntime } from "effect";
import { globalValue } from "effect/GlobalValue";

/**
 * Runtime for the application that exposes the services that can be used
 * from the UI layer.
 */
export const getOrCreateRuntime = () =>
  globalValue("echo-runtime", () =>
    ManagedRuntime.make(
      Layer.mergeAll(AppInitLive, AddProviderWorkflowLive).pipe(
        Layer.provideMerge(MainLive),
      ),
    ),
  );

/**
 * Type that represents the runtime that is available in the application.
 */
export type EchoRuntime = ReturnType<typeof getOrCreateRuntime>;

/**
 * Type that represents the services that are available in the runtime.
 */
export type EchoRuntimeServices<TRuntime = EchoRuntime> =
  TRuntime extends ManagedRuntime.ManagedRuntime<infer A, infer _R> ? A : never;
