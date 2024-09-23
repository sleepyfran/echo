import {
  ArtistImageProvider,
  Database,
  type DatabaseArtist,
} from "@echo/core-types";
import { Effect, Option } from "effect";

export const syncArtistsImages = Effect.gen(function* () {
  const database = yield* Database;
  const artistTable = yield* database.table("artists");

  const artists = yield* artistTable.all;
  yield* Effect.all(
    artists
      .filter((artist) => {
        return !artist.image;
      })
      .map(syncArtistImages),
  ).pipe(Effect.ensuring(Effect.log("All artists images have been synced.")));
});

const syncArtistImages = (artist: DatabaseArtist) =>
  Effect.gen(function* () {
    yield* Effect.log(
      `Artist ${artist.name} has no image, attempting to load it from the image provider...`,
    );

    const database = yield* Database;
    const artistTable = yield* database.table("artists");
    const imageProvider = yield* ArtistImageProvider;
    const artistImage = yield* imageProvider.imageForArtist(artist.name);

    if (Option.isSome(artistImage)) {
      yield* Effect.log(
        `Fetched image for artist ${artist.name} updating record in the database...`,
      );

      yield* artistTable.putOne({
        ...artist,
        image: artistImage.value,
      });
    }
  });
