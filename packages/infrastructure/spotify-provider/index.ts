import { Layer } from "effect";
import { SpotifyAuthenticationLive } from "./src/spotify-authentication";
import { SpotifyProviderLive } from "./src/spotify-provider";
import { SpotifyAuthApiLive } from "./src/apis/auth-api";
import { SpotifyLibraryApiLive } from "./src/apis/user-library-api";

/**
 * Layer that can be used to construct the Spotify provider. The returned
 * provider can then be used to retrieve the authentication provider
 * (in this case, Spotify) or create a new instance of the Spotify provider
 * given the authentication info returned by Spotify.
 */
export const SpotifyProviderFactoryLive = SpotifyProviderLive.pipe(
  Layer.provide(SpotifyAuthenticationLive),
  Layer.provide(SpotifyAuthApiLive),
  Layer.provide(SpotifyLibraryApiLive),
);
