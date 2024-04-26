import { Context } from "effect";

/**
 * Defines the global application configuration.
 */
export type AppConfig = {
  /**
   * Settings related to the Graph API.
   */
  graph: {
    /**
     * The client ID of the application registered in Azure AD.
     */
    clientId: string;

    /**
     * The redirect URI of the application registered in Azure AD.
     */
    redirectUri: string;

    /**
     * List of scopes to request when authenticating.
     */
    scopes: string[];
  };
};

/**
 * Tag to identify the application configuration in the context.
 */
export const AppConfig = Context.GenericTag<AppConfig>(
  "@echo/core-types/AppConfig",
);
