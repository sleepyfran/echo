import {
  MediaPlayerFactory,
  MediaPlayerId,
  PlayNotFoundError,
  ProviderType,
} from "@echo/core-types";
import { Effect, Layer, Stream } from "effect";

const make = MediaPlayerFactory.of({
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
        _tag: ProviderType.FileBased,
        id: MediaPlayerId("html5-audio"),
        playFile: (trackUrl) =>
          Effect.gen(function* () {
            yield* Effect.log(`Requesting to play ${trackUrl.href}`);
            audioElement.src = trackUrl.href;
            yield* Effect.tryPromise({
              try: () => audioElement.play(),
              catch: () => new PlayNotFoundError(),
            });
          }),
        togglePlayback: Effect.sync(() => {
          audioElement.paused ? audioElement.play() : audioElement.pause();
        }),
        observe: Stream.async((emit) => {
          // TODO: Keep track in the state? If something, it can be done via a ref.
          audioElement.onplay = () => emit.single("trackPlaying");
          audioElement.onpause = () => emit.single("trackPaused");
          audioElement.onended = () => emit.single("trackEnded");
        }),
        dispose: Effect.sync(() => {
          const audioElement = document.querySelector("audio");
          if (audioElement) {
            audioElement.remove();
          }
        }),
      };
    }),
});

/**
 * Implementation of the media player service using the HTML5 audio element.
 * Adds an invisible HTML5 audio element to the DOM upon creating the layer and
 * uses that element to play audio files on demand.
 */
export const HtmlAudioMediaPlayerFactoryLive = Layer.succeed(
  MediaPlayerFactory,
  make,
);
