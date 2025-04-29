import type { ProviderId } from "../model";
import type {
  AuthenticationError,
  AuthenticationInfo,
} from "../model/authentication";
import { Effect, Option } from "effect";

/**
 * Service that can connect to an authentication provider to authenticate the user.
 */
export type Authentication = {
  /**
   * Implements the authentication flow for a specific provider.
   */
  connect: Effect.Effect<AuthenticationInfo, AuthenticationError>;

  /**
   * Attempts to silently authenticate the user with the cached credentials,
   * if available. If the credentials are not available, the service will run
   * the connect flow.
   */
  connectSilent: (
    cachedCredentials: AuthenticationInfo,
    forceRefresh?: boolean,
  ) => Effect.Effect<AuthenticationInfo, AuthenticationError>;

  /**
   * Signs out from the provider, clearing the cached authentication info
   */
  signOut: Effect.Effect<void, AuthenticationError>;
};

/**
 * Service that can hold a cache of the currently authenticated providers. This
 * should be the source of truth for the authentication information.
 */
export type IAuthenticationCache = {
  /**
   * Retrieves the cached authentication info for a given provider.
   */
  get: (
    provider: ProviderId,
  ) => Effect.Effect<Option.Option<AuthenticationInfo>>;
};

/**
 * Tag to identify the AuthenticationCache service.
 */
export class AuthenticationCache extends Effect.Tag(
  "@echo/core-types/AuthenticationCache",
)<AuthenticationCache, IAuthenticationCache>() {}

/**
 * Service that supervises the authentication info and triggers the refresh
 * process when the auth of a certain provider is about to expire.
 */
export type IAuthenticationRefresher = {
  /**
   * Starts listening to provider start events and schedules the refresh of the
   * authentication info when the token is about to expire.
   */
  start: Effect.Effect<void>;
};

/**
 * Tag to identify the AuthenticationRefresher service.
 */
export class AuthenticationRefresher extends Effect.Tag(
  "@echo/core-types/AuthenticationRefresher",
)<AuthenticationRefresher, IAuthenticationRefresher>() {}
