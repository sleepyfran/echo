import { Keyboard, type GlobalKeyboardEvent } from "@echo/core-types";
import { GLOBAL_KEYBINDINGS } from "@echo/core-config";
import { Effect, Layer, Stream, Option } from "effect";
import { normalizeKeybinding, normalizeKeyboardEvent } from "./keys";

/**
 * Implementation of the keyboard service that parses the global keyboard listener
 * definitions provided in the core config and exposes the events as a stream.
 */
export const KeyboardLive = Layer.scoped(
  Keyboard,
  Effect.gen(function* () {
    const keybindingMap = new Map<string, GlobalKeyboardEvent>();

    for (const [keybinding, event] of GLOBAL_KEYBINDINGS) {
      const normalizedKey = normalizeKeybinding(keybinding);
      keybindingMap.set(normalizedKey, event);
    }

    yield* Effect.log(`Registered ${keybindingMap.size} global keybindings.`);

    const stream = Stream.fromEventListener(window, "keydown").pipe(
      Stream.filterMap((event) => {
        const normalizedEvent = normalizeKeyboardEvent(event as KeyboardEvent);
        const mappedEvent = keybindingMap.get(normalizedEvent);
        return Option.fromNullable(mappedEvent);
      }),
    );

    return Keyboard.of({
      observe: Effect.succeed(stream),
      observeEvent: (eventType: GlobalKeyboardEvent) =>
        Effect.succeed(
          stream.pipe(Stream.filter((event) => event === eventType)),
        ),
    });
  }),
);
