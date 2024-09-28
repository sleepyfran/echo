import * as S from "@effect/schema/Schema";
import {
  HttpApi,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import type { Effect } from "effect";

const PlayTrackEndpoint = HttpApiEndpoint.get(
  "playTrack",
  "/me/player/play",
).pipe(
  HttpApiEndpoint.setPath(
    S.Struct({
      context_uri: S.String,
      position_ms: S.String,
    }),
  ),
  HttpApiEndpoint.setHeaders(
    S.Struct({
      Authorization: S.String,
    }),
  ),
);

const PlayerApiGroup = HttpApiGroup.make("player").pipe(
  HttpApiGroup.add(PlayTrackEndpoint),
);

/**
 * API client for the Spotify player API.
 */
export const PlayerApi = HttpApiClient.make(
  HttpApi.empty.pipe(HttpApi.addGroup(PlayerApiGroup)),
  {
    baseUrl: "https://api.spotify.com",
  },
);
export type PlayerApi = Effect.Effect.Success<typeof PlayerApi>;
