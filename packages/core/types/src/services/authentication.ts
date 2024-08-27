import type {
  AuthenticationError,
  AuthenticationInfo,
} from "../model/authentication";
import type { Effect } from "effect/Effect";

/**
 * Service that can connect to an authentication provider to authenticate the user.
 */
export type Authentication = {
  /**
   * Implements the authentication flow for a specific provider.
   */
  connect: Effect<AuthenticationInfo, AuthenticationError>;

  /**
   * Attempts to silently authenticate the user with the cached credentials,
   * if available. If the credentials are not available, the service will run
   * the connect flow.
   */
  connectSilent: (
    cachedCredentials: AuthenticationInfo,
  ) => Effect<AuthenticationInfo, AuthenticationError>;
};
