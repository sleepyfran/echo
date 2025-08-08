import { Context } from "effect";
import * as S from "effect/Schema";

/**
 * Defines the schema for the application configuration.
 */
export const AppConfigSchema = S.Struct({
  /**
   * General settings that apply to the overall application.
   */
  echo: S.Struct({
    /**
     * Base URL in which the application is currently running.
     */
    baseUrl: S.String.pipe(
      S.nonEmptyString(),
      S.filter(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
      ),
    ),
  }),

  /**
   * Settings related to the Graph API.
   */
  graph: S.Struct({
    /**
     * The client ID of the application registered in Azure AD.
     */
    clientId: S.String.pipe(S.nonEmptyString()),

    /**
     * The redirect URI of the application registered in Azure AD.
     */
    redirectUri: S.String.pipe(
      S.nonEmptyString(),
      S.filter(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
      ),
    ),

    /**
     * List of scopes to request when authenticating.
     */
    scopes: S.NonEmptyArray(S.String),
  }),

  /**
   * Settings related to the Spotify API.
   */
  spotify: S.Struct({
    /**
     * The client ID of the application registered in Spotify.
     */
    clientId: S.String.pipe(S.nonEmptyString()),

    /**
     * The client secret of the application registered in Spotify.
     */
    secret: S.String.pipe(S.nonEmptyString()),

    /**
     * The redirect URI of the application registered in Spotify.
     */
    redirectUri: S.String.pipe(
      S.nonEmptyString(),
      S.filter(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
      ),
    ),
  }),
});

/**
 * Defines the global application configuration.
 */
export type AppConfig = S.Schema.Type<typeof AppConfigSchema>;

/**
 * Tag to identify the application configuration in the context.
 */
export const AppConfig = Context.GenericTag<AppConfig>(
  "@echo/core-types/AppConfig",
);
