import type { Keybinding } from "packages/core/types";

/**
 * Normalizes a keybinding into a string representation by concatenating all
 * its modifier keys and the main key into a single string (e.g., "Ctrl+Shift+K").
 *
 * Note: `ctrlOrMetaKey` is represented as "Ctrl".
 */
export const normalizeKeybinding = (keybinding: Keybinding): string => {
  const parts: string[] = [];

  if (keybinding.ctrlOrMetaKey) {
    parts.push("Ctrl");
  }

  if (keybinding.shiftKey) {
    parts.push("Shift");
  }

  if (keybinding.altKey) {
    parts.push("Alt");
  }

  parts.push(keybinding.key.toUpperCase());

  return parts.join("+");
};

/**
 * Normalizes a KeyboardEvent into a string representation by concatenating all
 * its modifier keys and the main key into a single string (e.g., "Ctrl+Shift+K").
 *
 * Note: `ctrlKey` or `metaKey` is represented as "Ctrl".
 */
export const normalizeKeyboardEvent = (event: KeyboardEvent): string => {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) {
    parts.push("Ctrl");
  }

  if (event.shiftKey) {
    parts.push("Shift");
  }

  if (event.altKey) {
    parts.push("Alt");
  }

  // Use `code` to get the physical key pressed, ignoring keyboard layout. This
  // ensures that pressing certain combinations (e.g., Option+Shift+F on macOS,
  // which produces "Ï") is consistently recognized.
  parts.push(event.code.replace("Key", "").toUpperCase());

  return parts.join("+");
};
