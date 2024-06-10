import { AppConfig } from "@echo/core-types";
import { Layer } from "effect";

/**
 * The application configuration.
 */
export const appConfig: AppConfig = {
  graph: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
    scopes: import.meta.env.VITE_SCOPES.split(","),
  },
};

/**
 * Provides the application configuration.
 */
export const AppConfigLive = Layer.succeed(AppConfig, AppConfig.of(appConfig));
