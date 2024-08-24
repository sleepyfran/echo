import { Schema } from "@effect/schema";
import { Context } from "effect";

/**
 * Defines the schema for the application configuration.
 */
export const AppConfigSchema = Schema.Struct({
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
