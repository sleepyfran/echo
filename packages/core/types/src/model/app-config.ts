import { Schema } from "@effect/schema";
import { Context } from "effect";

/**
 * Defines the schema for the application configuration.
 */
export const AppConfigSchema = Schema.Struct({
  /**
   * General settings that apply to the overall application.
   */
  echo: Schema.Struct({
    /**
     * Base URL in which the application is currently running.
     */
    baseUrl: Schema.String.pipe(
      Schema.nonEmptyString(),
      Schema.filter(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
      ),
    ),
  }),

  /**
   * Settings related to the Graph API.
   */
  graph: Schema.Struct({
    /**
     * The client ID of the application registered in Azure AD.
     */
    clientId: Schema.String.pipe(Schema.nonEmptyString()),

    /**
     * The redirect URI of the application registered in Azure AD.
     */
    redirectUri: Schema.String.pipe(
      Schema.nonEmptyString(),
      Schema.filter(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
      ),
    ),

    /**
     * List of scopes to request when authenticating.
     */
    scopes: Schema.NonEmptyArray(Schema.String),
  }),

  /**
   * Settings related to the Spotify API.
   */
  spotify: Schema.Struct({
    /**
     * The client ID of the application registered in Spotify.
     */
    clientId: Schema.String.pipe(Schema.nonEmptyString()),

    /**
     * The client secret of the application registered in Spotify.
     */
    secret: Schema.String.pipe(Schema.nonEmptyString()),
  }),
});

/**
 * Defines the global application configuration.
 */
export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>;

/**
 * Tag to identify the application configuration in the context.
 */
export const AppConfig = Context.GenericTag<AppConfig>(
  "@echo/core-types/AppConfig",
);
