import * as S from "effect/Schema";

/**
 * Defines the specific information that is needed to authenticate with MSAL.
 */
export const MsalSpecificAuthenticationInfo = S.TaggedStruct("MSAL", {
  account: S.Struct({
    homeAccountId: S.String.pipe(S.nonEmptyString()),
    environment: S.String.pipe(S.nonEmptyString()),
    tenantId: S.String.pipe(S.nonEmptyString()),
    username: S.String.pipe(S.nonEmptyString()),
    localAccountId: S.String.pipe(S.nonEmptyString()),
  }),
});

/**
 * Defines the specific information that is needed to authenticate with Spotify.
 */
export const SpotifySpecificAuthenticationInfo = S.TaggedStruct("Spotify", {
  refreshToken: S.String.pipe(S.nonEmptyString()),
});

/**
 * Defines all the provider-specific information that is needed to authenticate
 * with a specific provider.
 */
export const ProviderSpecificAuthenticationInfo = S.Union(
  MsalSpecificAuthenticationInfo,
  SpotifySpecificAuthenticationInfo,
);
export type ProviderSpecificAuthenticationInfo = S.Schema.Type<
  typeof ProviderSpecificAuthenticationInfo
>;

/**
 * Defines the result of a successfully authenticated user, with the information
 * that is needed to use a service that requires authentication.
 */
export const AuthenticationInfo = S.Struct({
  /**
   * Token that can be used to authenticate the user.
   */
  accessToken: S.String.pipe(S.nonEmptyString()),

  /**
   * Provider-specific information that is needed to authenticate with the
   * provider.
   */
  providerSpecific: ProviderSpecificAuthenticationInfo,

  /**
   * Date in which the token expires.
   */
  expiresOn: S.Date,
});
export type AuthenticationInfo = S.Schema.Type<typeof AuthenticationInfo>;

/**
 * Defines the error that can occur when authenticating a user.
 */
export enum AuthenticationError {
  InteractionRequired = "InteractionRequired",
  Unknown = "Unknown",
  WrongCredentials = "WrongCredentials",
  InteractionTimedOut = "InteractionTimedOut",
  InteractionFailed = "InteractionFailed",
}
