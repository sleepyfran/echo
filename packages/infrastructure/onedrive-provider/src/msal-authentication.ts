import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AuthenticationResult as MsalAuthenticationResult,
} from "@azure/msal-browser";
import { addHours } from "@echo/core-dates";
import {
  AppConfig,
  type Authentication,
  AuthenticationError,
  type AuthenticationInfo,
  ProviderSpecificAuthenticationInfo,
} from "@echo/core-types";
import { Context, Effect, Layer, Ref } from "effect";

/**
 * Tag to identify the MSAL implementation of the Authentication interface.
 */
export const MsalAuthentication = Context.GenericTag<Authentication>(
  "@echo/infrastructure-msal-authentication/MsalAuthentication",
);

/**
 * Implementation of the authentication interface that uses MSAL as the provider.
 * Exports a layer that can be used to construct the service, which will keep
 * an internal reference to the MSAL application and use it to perform a pop-up
 * login when attempting to connect.
 */
export const MsalAuthenticationLive = Layer.effect(
  MsalAuthentication,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    const msalAppRef = yield* Ref.make(
      new PublicClientApplication({
        auth: {
          clientId: appConfig.graph.clientId,
          redirectUri: appConfig.graph.redirectUri,
        },
        cache: {
          cacheLocation: "localStorage",
          temporaryCacheLocation: "sessionStorage",
          storeAuthStateInCookie: true,
        },
      }),
    );

    const authRequest = { scopes: [...appConfig.graph.scopes] };

    const handleResponse = (
      authResult: MsalAuthenticationResult | null,
    ): Effect.Effect<AuthenticationInfo, AuthenticationError> =>
      Effect.gen(function* () {
        if (authResult) {
          return {
            accessToken: authResult.accessToken,
            expiresOn: authResult.expiresOn ?? addHours(new Date(), 2),
            providerSpecific: ProviderSpecificAuthenticationInfo.make({
              account: authResult.account,
            }),
          };
        }

        return yield* Effect.fail(AuthenticationError.Unknown);
      });

    const connect = Effect.gen(function* () {
      const app = yield* msalAppRef.get;

      yield* Effect.tryPromise({
        try: () => app.initialize(),
        catch: () => AuthenticationError.Unknown,
      });

      const authResult = yield* Effect.tryPromise({
        try: () => app.acquireTokenPopup(authRequest),
        catch: () => AuthenticationError.Unknown,
      });

      return yield* handleResponse(authResult);
    });

    const connectSilent = (cachedCredentials: AuthenticationInfo) =>
      Effect.gen(function* () {
        const app = yield* msalAppRef.get;

        if (cachedCredentials.providerSpecific._tag !== "MSAL") {
          yield* Effect.logError(
            "Cached credentials are not MSAL-specific, cannot connect silently",
          );
          return yield* Effect.fail(AuthenticationError.WrongCredentials);
        }

        yield* Effect.tryPromise({
          try: () => app.initialize(),
          catch: () => AuthenticationError.Unknown,
        });

        return yield* Effect.tryPromise({
          try: () =>
            app.acquireTokenSilent({
              ...authRequest,
              account: cachedCredentials.providerSpecific.account,
            }),
          catch: (e) => {
            console.error(e);
            return e instanceof InteractionRequiredAuthError
              ? AuthenticationError.InteractionRequired
              : AuthenticationError.Unknown;
          },
        }).pipe(
          Effect.tap((authInfo) =>
            Effect.log(
              `Successfully connected silently using MSAL, new token expiration ${authInfo.expiresOn}`,
            ),
          ),
          Effect.tapError((e) =>
            Effect.logError(`Error while connecting silently: ${e}`),
          ),
          Effect.flatMap(handleResponse),
          Effect.orElse(() => connect),
        );
      });

    return MsalAuthentication.of({
      connect,
      connectSilent,
    });
  }),
);
