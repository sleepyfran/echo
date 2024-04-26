import { Layer } from "effect";
import { MsalAuthenticationLive } from "./src/msal-authentication";
import { OneDriveProviderLive } from "./src/onedrive-provider";

/**
 * Layer that can be used to construct the OneDrive provider given the configuration
 * of the app. The returned provider can then be used to retrieve the authentication
 * provider (in this case, MSAL) or create a new instance of the OneDrive provider
 * given the authentication info returned by MSAL.
 */
export const OneDriveProviderFactoryLive = OneDriveProviderLive.pipe(
  Layer.provide(MsalAuthenticationLive),
);
