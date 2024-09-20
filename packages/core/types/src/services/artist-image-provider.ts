import { Context, Effect, Option } from "effect";

/**
 * Provider for images of artists.
 */
export type ArtistImageProvider = {
  /**
   * Retrieves an image for the given artist.
   */
  imageForArtist: (artistName: string) => Effect.Effect<Option.Option<Blob>>;
};

/**
 * Tag to identify the metadata provider service.
 */
export const ArtistImageProvider = Context.GenericTag<ArtistImageProvider>(
  "@echo/core-types/ArtistImageProvider",
);
