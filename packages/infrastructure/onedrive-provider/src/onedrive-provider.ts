import { MediaProviderFactory, ProviderType } from "@echo/core-types";
import { Effect, Layer } from "effect";
import { MsalAuthentication } from "./msal-authentication";
import { Client, type ClientOptions } from "@microsoft/microsoft-graph-client";
import { createListRoot } from "./apis/list-root.graph-api";
import { createListFolder } from "./apis/list-folder.graph-api";
import { createFileUrlById } from "./apis/file-url-by-id.graph-api";

/**
 * Implementation of the OneDrive provider that uses MSAL for authentication and
 * GraphAPI to interact with the underlying file system. Exports a layer that
 * can be used to either get the authentication provider or create a new instance
 * of the media provider based on the authentication info given by the auth
 * provider.
 */
export const OneDriveProviderLive = Layer.effect(
  MediaProviderFactory,
  Effect.gen(function* () {
    const msalAuth = yield* MsalAuthentication;

    return MediaProviderFactory.of({
      authenticationProvider: Effect.succeed(msalAuth),
      createMediaProvider: (authInfo) => {
        const options: ClientOptions = {
          authProvider: {
            getAccessToken: () => Promise.resolve(authInfo.accessToken),
          },
        };

        const client = Client.initWithMiddleware(options);

        return {
          _tag: ProviderType.FileBased,
          listRoot: createListRoot(client),
          listFolder: createListFolder(client),
          fileUrlById: createFileUrlById(client),
        };
      },
    });
  }),
);
