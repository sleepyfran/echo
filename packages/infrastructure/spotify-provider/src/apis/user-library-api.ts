import * as S from "@effect/schema/Schema";
import {
  HttpApi,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import { SpotifyUserSavedAlbumsResponse } from "./types";

const SavedAlbumsEndpoint = HttpApiEndpoint.get(
  "savedAlbums",
  "/v1/me/albums",
).pipe(
  HttpApiEndpoint.setSuccess(SpotifyUserSavedAlbumsResponse),
  HttpApiEndpoint.setPath(
    S.Struct({
      limit: S.String,
      offset: S.String,
    }),
  ),
  HttpApiEndpoint.setHeaders(
    S.Struct({
      Authorization: S.String,
    }),
  ),
);

const AlbumsApiGroup = HttpApiGroup.make("albums").pipe(
  HttpApiGroup.add(SavedAlbumsEndpoint),
);

/**
 * API client for the Spotify user library API.
 */
export const UserLibraryApi = HttpApiClient.make(
  HttpApi.empty.pipe(HttpApi.addGroup(AlbumsApiGroup)),
  {
    baseUrl: "https://api.spotify.com",
  },
);
