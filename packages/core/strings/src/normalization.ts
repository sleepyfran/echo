/**
 * Removes all diacritics from a given string.
 * @param input The string to remove diacritics from.
 */
export const removeDiacritics = (input: string): string =>
  input.normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * Normalizes a string to be able to compare it, which removes diacritics and
 * lowercases the string.
 * @param input The string to normalize.
 */
export const normalizeForComparison = (input: string): string =>
  removeDiacritics(input.toLowerCase());
