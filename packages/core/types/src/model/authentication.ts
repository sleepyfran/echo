/**
 * Defines the result of a successfully authenticated user, with the information
 * that is needed to use a service that requires authentication.
 */
export type AuthenticationInfo = {
  /**
   * Token that can be used to authenticate the user.
   */
  accessToken: string;

  /**
   * Date in which the token expires.
   */
  expiresOn: Date;
};

/**
 * Defines the error that can occur when authenticating a user.
 */
export enum AuthenticationError {
  Unknown = "Unknown",
}
