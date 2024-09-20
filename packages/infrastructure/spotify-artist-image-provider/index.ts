import { AppConfig, ArtistImageProvider } from "@echo/core-types";
import { Cache, Data, Effect, Layer, Option } from "effect";

type SpotifyArtistResponse = {
  artists: {
    items: {
      images: { url: string }[];
    }[];
  };
};

class TokenRetrievalFailed extends Data.TaggedError(
  "TokenRetrievalFailed",
)<{}> {}

type CacheKey = "token";

const tokenRetriever = (config: AppConfig) => (_key: CacheKey) =>
  Effect.tryPromise<string>(() =>
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      body: `grant_type=client_credentials`,
      headers: {
        Authorization: `Basic ${btoa(
          `${config.spotify.clientId}:${config.spotify.secret}`,
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((json) => json.access_token),
  ).pipe(Effect.catchAll(() => Effect.fail(new TokenRetrievalFailed())));

const make = Effect.gen(function* () {
  const config = yield* AppConfig;

  const tokenCache = yield* Cache.make({
    capacity: 1,
    timeToLive: "1 hour",
    lookup: tokenRetriever(config),
  });

  return ArtistImageProvider.of({
    imageForArtist: (artistName: string) =>
      Effect.gen(function* () {
        const token = yield* tokenCache.get("token").pipe(Effect.option);
        if (Option.isNone(token)) {
          yield* Effect.logError(
            "Failed to retrieve Spotify token, unable to retrieve image.",
          );
          return Option.none();
        }

        yield* Effect.log(`Fetching image for artist ${artistName}...`);

        const response = yield* Effect.tryPromise<SpotifyArtistResponse>(() =>
          fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(
              artistName,
            )}&type=artist`,
            {
              headers: {
                Authorization: `Bearer ${token.value}`,
              },
            },
          ).then((response) => response.json()),
        ).pipe(
          Effect.tapError((error) =>
            Effect.logError(`Failed to fetch artist's image: ${error}`),
          ),
          Effect.catchAll(() =>
            Effect.succeed({
              artists: { items: [] },
            } as SpotifyArtistResponse),
          ),
        );

        const imageUrl = response.artists.items[0]?.images[0]?.url;
        if (!imageUrl) {
          yield* Effect.logWarning(
            `Spotify returned no image for artist ${artistName}.`,
          );
          return Option.none();
        }

        yield* Effect.log(
          `Fetched image for artist ${artistName}. URL: ${imageUrl}`,
        );
        return yield* Effect.tryPromise<Blob>(() =>
          fetch(imageUrl).then((response) => response.blob()),
        ).pipe(
          Effect.tapError((error) =>
            Effect.logError(`Failed to fetch image blob: ${error}`),
          ),
          Effect.option,
        );
      }),
  });
});

/**
 * Implementation of the artist image provider service using the Spotify API.
 */
export const SpotifyArtistImageProvider = Layer.effect(
  ArtistImageProvider,
  make,
);
