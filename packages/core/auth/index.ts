import type { AuthenticationInfo } from "@echo/core-types";

/**
 * Checks if the given authentication token is still valid.
 */
export const isValidToken = (authInfo: AuthenticationInfo) =>
  authInfo.expiresOn > new Date();
