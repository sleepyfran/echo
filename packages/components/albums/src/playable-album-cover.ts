import { Option } from "effect";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Player, type Album } from "@echo/core-types";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@echo/components-icons";
import "@echo/components-ui-atoms";
import { StreamConsumer } from "@echo/components-shared-controllers";

enum PlayStatus {
  Playing,
  Paused,
  NotPlaying,
}

/**
 * An element that displays the cover of an album from the user's library
 * and a button to play it.
 */
@customElement("playable-album-cover")
export class PlayableAlbumCover extends LitElement {
  @property({ type: Object })
  album!: Album;

  @property({ type: Boolean })
  detailsAlwaysVisible = false;

  @state()
  private _playStatus = PlayStatus.NotPlaying;

  private _playAlbum = new EffectFn(this, Player.playAlbum);
  private _togglePlayback = new EffectFn(this, () => Player.togglePlayback);

  static styles = css`
    div.album-container {
      display: flex;
      flex-direction: column;
    }

    div.img-wrapper {
      position: relative;
    }

    provider-icon {
      opacity: 0;
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 1;
      transition: opacity 0.5s;
    }

    button.play {
      opacity: 0;
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      background-color: var(--accent-color);
      color: var(--text-color);
      border: none;
      padding: 0.5rem;
      border-radius: 100%;
      font-size: 2rem;
      cursor: pointer;
      height: 4rem;
      width: 4rem;
      box-shadow: var(--large-shadow);
      transform: translate3d(1rem, 1rem, 1rem);
      transition:
        filter var(--long-transition-duration),
        opacity var(--long-transition-duration);
    }

    button.play:hover {
      filter: brightness(1.3);
    }

    div.img-wrapper:not([always-visible]):hover img.album-cover {
      filter: brightness(0.8);
    }

    div.img-wrapper[always-visible] button.play {
      opacity: 1;
    }

    div.img-wrapper[always-visible] provider-icon {
      opacity: 1;
    }

    div.img-wrapper:hover provider-icon {
      opacity: 1;
    }

    div.img-wrapper:hover button.play {
      opacity: 1;
    }

    img.album-cover {
      border-radius: 2%;
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: relative;
      transition: filter var(--long-transition-duration);
    }

    div.album-info {
      cursor: pointer;
      padding: 10px;
      box-sizing: border-box;
    }

    a {
      text-decoration: none;
      color: var(--text-color);
    }

    h5,
    p {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    h5 {
      margin: 0;
      font-size: 1rem;
    }

    p {
      margin: 0;
      font-size: 0.8em;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    new StreamConsumer(this, Player.observe, {
      item: (playerStatus) => {
        if (
          playerStatus.status._tag === "Stopped" ||
          playerStatus.status.album.id !== this.album.id
        ) {
          this._playStatus = PlayStatus.NotPlaying;
          return;
        }

        this._playStatus =
          playerStatus.status._tag === "Playing"
            ? PlayStatus.Playing
            : PlayStatus.Paused;
      },
    });
  }

  render() {
    return html`
      <div class="img-wrapper" ?always-visible=${this.detailsAlwaysVisible}>
        <provider-icon
          providerId=${this.album.providerId}
          title=${`This album is hosted on ${this.album.providerId}`}
        ></provider-icon>
        ${Option.isSome(this.album.embeddedCover) &&
        html`
          <img
            src="${URL.createObjectURL(this.album.embeddedCover.value)}"
            alt="Album cover"
            class="album-cover"
          />
        `}
        <button class="play" @click=${this._onPlayClick} title="Play">
          ${this._playStatus === PlayStatus.Playing
            ? html`<pause-icon size="24"></pause-icon>`
            : html`<play-icon size="24"></play-icon>`}
        </button>
      </div>
    `;
  }

  private _onPlayClick() {
    if (this._playStatus === PlayStatus.NotPlaying) {
      return this._playAlbum.run(this.album);
    }

    this._togglePlayback.run({});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "playable-album-cover": PlayableAlbumCover;
  }
}
