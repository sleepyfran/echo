import type { Genre } from "@echo/core-types";
import { HashSet } from "effect";

/**
 * Attempts to parse each individual genre from the given array into a flattened
 * array of genres. This is done to properly identify genres that were added
 * as a comma-separated string.
 */
export const flatten = (genres: string[]): Genre[] =>
  genres.flatMap((genre) => genre.split(",").map((g) => g.trim())) as Genre[];

/**
 * Adds the given list of genres to a list of existing genres, making sure
 * that there are no duplicates.
 */
export const addTo = (currentGenres: Genre[], newGenres: Genre[]): Genre[] => {
  const updatedGenres = HashSet.fromIterable(currentGenres).pipe(
    HashSet.union(newGenres),
  );

  return Array.from(updatedGenres);
};
