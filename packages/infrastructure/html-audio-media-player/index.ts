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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).safari) {
              yield* Effect.log(
                "Detected Safari browser, playing via source elements.",
              );
              yield* playViaSourceElement(audioElement, trackUrl);
            } else {
              yield* playViaSrc(audioElement, trackUrl);
            }

            yield* Effect.tryPromise({
              try: () => audioElement.play(),
              catch: () => new PlayNotFoundError(),
            });
          }),
        togglePlayback: Effect.sync(() => {
          audioElement.paused ? audioElement.play() : audioElement.pause();
        }),
        stop: Effect.sync(() => {
          audioElement.pause();
          audioElement.currentTime = 0;
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
 * On Safari, for some godforsaken reason, the audio element does not work
 * at all with certain file types (FLAC, for example), but they do work
 * when using source elements. HOWEVER, on Firefox using this approach leads
 * to the funniest of bugs where the audio element will keep playing the same
 * track over and over again, even if the source is changed. There's probably
 * yet another workaround for that, but I'm not going to bother with it. If
 * we detect Safari, we'll use source elements, otherwise we'll use the src
 * attribute.
 */
const playViaSourceElement = (audioElement: HTMLAudioElement, trackUrl: URL) =>
  Effect.gen(function* () {
    yield* Effect.log(
      "Attempting to play via source elements, cleaning out previous sources...",
    );
    while (audioElement.firstChild) {
      yield* Effect.sync(
        () =>
          audioElement.firstChild &&
          audioElement.removeChild(audioElement.firstChild),
      );
    }

    yield* Effect.log(`Requesting to play ${trackUrl.href}`);
    yield* Effect.sync(() => {
      const sourceElement = document.createElement("source");
      sourceElement.src = trackUrl.href;
      sourceElement.type = "audio/mpeg";

      audioElement.appendChild(sourceElement);
    });
  });

/**
 * Good ol' regular src attribute, for sane browsers.
 */
const playViaSrc = (audioElement: HTMLAudioElement, trackUrl: URL) =>
  Effect.gen(function* () {
    yield* Effect.log(
      `Requesting to play ${trackUrl.href} via regular src attribute.`,
    );
    yield* Effect.sync(() => {
      audioElement.src = trackUrl.href;
    });
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
