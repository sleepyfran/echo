import { Effect } from "effect";

/**
 * Lazy loads the default metadata provider. Currently, this effect returns
 * the Music Metadata Browser library wrapper.
 * @returns An effect that can provide the default metadata provider.
 */
export const lazyLoadMetadataProvider = Effect.promise(async () => {
  try {
    const { mmbMetadataProvider } = await import(
      "@echo/infrastructure-mmb-metadata-provider"
    );
    return mmbMetadataProvider;
  } catch (error) {
    // This should technically not happen, but since Music Metadata Browser is
    // using node dependencies and Vite is not particularly great at handling
    // those by default, print the error in big red letters so that it's easier
    // to spot.
    console.error(error);
    throw error;
  }
});
