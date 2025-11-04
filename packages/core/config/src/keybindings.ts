import type { Keybinding, GlobalKeyboardEvent } from "@echo/core-types";

type KeybindingWithEvent = [Keybinding, GlobalKeyboardEvent];

/**
 * Global keybindings used across the application.
 */
export const GLOBAL_KEYBINDINGS: KeybindingWithEvent[] = [
  [
    {
      key: "k",
      ctrlOrMetaKey: true,
    },
    "command-bar:open",
  ],
];
