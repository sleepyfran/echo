/**
 * Identifies OAuth responses before the application starts. MSAL Browser v5
 * requires these URLs to be handled by its redirect bridge instead of loading
 * the application in the authentication popup.
 */
export const isAuthenticationResponse = (
  location: Pick<Location, "hash" | "search">,
) => {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));

  return [query, fragment].some(
    (params) =>
      params.has("state") && (params.has("code") || params.has("error")),
  );
};
