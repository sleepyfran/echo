import { Effect } from "effect";

/**
 * Service that encapsulates the orchestration for initializing the application
 * during a cold boot.
 */
export type IAppInit = {
  /**
   * Initializes the application by performing reading the last known state of
   * the providers from the storage and re-starting them with the last
   * used credentials. If the credentials have expired, then the initialization
   * of the provider will fail and the user will have to re-add the provider.
   */
  readonly init: Effect.Effect<void>;
};

/**
 * Tag to identify the AppInit service.
 */
export class AppInit extends Effect.Tag("@echo/core-types/AppInit")<
  AppInit,
  IAppInit
>() {}
