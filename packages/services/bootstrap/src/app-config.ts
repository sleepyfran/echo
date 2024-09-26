import { AppConfig } from "@echo/core-types";
import { Layer } from "effect";

/**
 * The application configuration.
 */
export const appConfig: AppConfig = {
  echo: {
    baseUrl: import.meta.env.VITE_ECHO_BASE_URL,
  },
  graph: {
    clientId: import.meta.env.VITE_GRAPH_CLIENT_ID,
    redirectUri: import.meta.env.VITE_GRAPH_REDIRECT_URI,
    scopes: import.meta.env.VITE_GRAPH_SCOPES.split(","),
  },
  spotify: {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    secret: import.meta.env.VITE_SPOTIFY_SECRET,
  },
};

/**
 * Provides the application configuration.
 */
export const AppConfigLive = Layer.succeed(AppConfig, AppConfig.of(appConfig));
