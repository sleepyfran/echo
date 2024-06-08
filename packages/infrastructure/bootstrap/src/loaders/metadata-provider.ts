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
    console.error(error);
    throw error;
  }
});
