import { Effect, type Stream } from "effect";
import type { GlobalKeyboardEvent } from "../model/keyboard-events";

/**
 * Service that listens to global keyboard events and allows to observe events
 * raised from them.
 */
export type IKeyboard = {
  /**
   * Returns a stream that can be used to listen to keyboard events.
   */
  readonly observe: Effect.Effect<Stream.Stream<GlobalKeyboardEvent>>;

  /**
   * Returns a stream that emits only the events of the given type.
   */
  readonly observeEvent: (
    eventType: GlobalKeyboardEvent,
  ) => Effect.Effect<Stream.Stream<GlobalKeyboardEvent>>;
};

/**
 * Tag to identify the Keyboard service.
 */
export class Keyboard extends Effect.Tag("@echo/core-types/Keyboard")<
  Keyboard,
  IKeyboard
>() {}

/**
 * Represents a keyboard binding that can be used to trigger commands.
 */
export type Keybinding = {
  /**
   * The key that must be pressed.
   */
  readonly key: string;

  /**
   * Whether the Ctrl (or CMD in macOS) key must be pressed.
   */
  readonly ctrlOrMetaKey?: boolean;

  /**
   * Whether the Alt key must be pressed.
   */
  readonly altKey?: boolean;

  /**
   * Whether the Shift key must be pressed.
   */
  readonly shiftKey?: boolean;
};
