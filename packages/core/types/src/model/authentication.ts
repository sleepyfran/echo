import * as S from "@effect/schema/Schema";

/**
 * Defines the result of a successfully authenticated user, with the information
 * that is needed to use a service that requires authentication.
 */
export const AuthenticationInfoSchema = S.Struct({
  /**
   * Token that can be used to authenticate the user.
   */
  accessToken: S.String.pipe(S.nonEmpty()),

  /**
   * Date in which the token expires.
   */
  expiresOn: S.Date,
});
export type AuthenticationInfo = S.Schema.Type<typeof AuthenticationInfoSchema>;

/**
 * Defines the error that can occur when authenticating a user.
 */
export enum AuthenticationError {
  Unknown = "Unknown",
}
