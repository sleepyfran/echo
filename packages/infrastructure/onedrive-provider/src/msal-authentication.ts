import { PublicClientApplication } from "@azure/msal-browser";
import { addHours } from "@echo/core-dates";
import {
  AppConfig,
  type Authentication,
  AuthenticationError,
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
      }),
    );

    return MsalAuthentication.of({
      connect: Effect.gen(function* () {
        const app = yield* msalAppRef.get;

        yield* Effect.tryPromise({
          try: () => app.initialize(),
          catch: () => AuthenticationError.Unknown,
        });

        const authResult = yield* Effect.tryPromise({
          try: () => app.loginPopup({ scopes: [...appConfig.graph.scopes] }),
          catch: () => AuthenticationError.Unknown,
        });

        if (authResult) {
          return {
            accessToken: authResult.accessToken,
            expiresOn: authResult.expiresOn ?? addHours(new Date(), 2),
          };
        }

        return yield* Effect.fail(AuthenticationError.Unknown);
      }),
    });
  }),
);
