import {
  Database,
  NonExistingArtistReferenced,
  EntityResolver,
  type Album,
  type Artist,
  type DatabaseAlbum,
  type DatabaseArtist,
  type DatabaseTrack,
  type Track,
} from "@echo/core-types";
import { Effect, Layer, Option } from "effect";

const make = Effect.gen(function* () {
  const database = yield* Database;

  return EntityResolver.of({
    album: (album) =>
      Effect.gen(function* () {
        const artistTable = yield* database.table("artists");
        const maybeArtist = yield* artistTable.byId(album.artistId);

        return yield* toAlbumSchema(album, maybeArtist);
      }),
    albumWithTracks: (album) =>
      Effect.gen(function* () {
        const tracksTable = yield* database.table("tracks");

        const tracks = yield* tracksTable.filtered({
          filter: {
            albumId: album.id,
          },
        });

        return {
          ...album,
          tracks: tracks
            .sort((a, b) => a.trackNumber - b.trackNumber)
            .map((track) => toTrackSchema(track, album, album.artist)),
        };
      }),
    artist: (artist) => Effect.sync(() => toArtistSchema(artist)),
  });
});

const toAlbumSchema = (
  album: DatabaseAlbum,
  artist: Option.Option<DatabaseArtist>,
): Effect.Effect<Album, NonExistingArtistReferenced> => {
  if (Option.isNone(artist)) {
    return Effect.fail(
      new NonExistingArtistReferenced(album.name, album.artistId),
    );
  }

  return Effect.succeed({
    ...album,
    artist: toArtistSchema(artist.value),
    embeddedCover: Option.fromNullable(album.embeddedCover),
    releaseYear: Option.fromNullable(album.releaseYear),
  });
};

const toArtistSchema = (artist: DatabaseArtist): Artist => ({
  ...artist,
  image: Option.fromNullable(artist.image),
});

const toTrackSchema = (
  track: DatabaseTrack,
  album: Album,
  artist: Artist,
): Track => ({
  ...track,
  albumInfo: album,
  mainArtist: artist,
  secondaryArtists: [],
});

/**
 * Implementation of the resolver service that uses the database to resolve
 * the associations between entities.
 */
export const EntityResolverLive = Layer.effect(EntityResolver, make);
