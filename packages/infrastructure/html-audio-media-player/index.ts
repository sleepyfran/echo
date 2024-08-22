import { MediaPlayerFactory, PlayNotFoundError } from "@echo/core-types";
import { Effect, Layer } from "effect";

const make = Effect.succeed(
  MediaPlayerFactory.of({
    createMediaPlayer: () =>
      Effect.gen(function* () {
        let audioElement = document.querySelector("audio");
        if (!audioElement) {
          yield* Effect.log(
            "Creating invisible audio element for media playback.",
          );

          audioElement = document.createElement("audio");
          audioElement.style.display = "none";
          document.body.appendChild(audioElement);

          yield* Effect.log("Audio element appended to the DOM.");
        }

        return {
          playFile: (trackUrl) =>
            Effect.gen(function* () {
              yield* Effect.log(`Requesting to play ${trackUrl.href}`);
              audioElement.src = trackUrl.href;
              yield* Effect.tryPromise({
                try: () => audioElement.play(),
                catch: () => new PlayNotFoundError(),
              });
            }),
          // observe: Effect.succeed(
          //   Stream.async((emit) => {
          //     // TODO: Keep track in the state? If something, it can be done via a ref.
          //     audio.onplay = () => emit.single({ _tag: "playing" });
          //     audio.onpause = () => emit.single({ _tag: "paused" });
          //     audio.onended = () => emit.single({ _tag: "idle" });
          //   }),
          // ),
        };
      }),
  }),
);

/**
 * Implementation of the media player service using the HTML5 audio element.
 * Adds an invisible HTML5 audio element to the DOM upon creating the layer and
 * uses that element to play audio files on demand.
 */
export const HtmlAudioMediaPlayerFactoryLive = Layer.effect(
  MediaPlayerFactory,
  make,
);
