import type { AuthenticationInfo } from "@echo/core-types";

/**
 * Checks if the given authentication token is still valid.
 */
export const isValidToken = (authInfo: AuthenticationInfo) =>
  authInfo.expiresOn > new Date();

/**
 * Checks whether the given authentication token is within 10 minutes of expiration.
 */
export const isTokenNearingExpiration = (authInfo: AuthenticationInfo) =>
  authInfo.expiresOn < new Date(Date.now() + 1000 * 60 * 10);
