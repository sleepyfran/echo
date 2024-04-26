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
};
