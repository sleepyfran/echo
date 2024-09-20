import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Player, type Album } from "@echo/core-types";
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@echo/components-icons";

/**
 * An element that displays an album from the user's library.
 */
@customElement("library-album")
export class LibraryAlbum extends LitElement {
  @property({ type: Object })
  album!: Album;

  private _playAlbum = new EffectFn(this, Player.playAlbum);

  static styles = css`
    div.album-container {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
    }

    div.album-container:hover {
      background-color: var(--background-color-muted);
      transition: background-color 1s;
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
      transition: all 0.5s;
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
    }

    div.album-info {
      cursor: pointer;
      padding: 10px;
      box-sizing: border-box;
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

  constructor() {
    super();
  }

  render() {
    return html`
      <div key="{album.id}" class="album-container">
        <div class="img-wrapper">
          <provider-icon
            providerId=${this.album.providerId}
            title=${`This album is hosted on ${this.album.providerId}`}
          ></provider-icon>
          ${this.album.embeddedCover &&
          html`
            <img
              src="${URL.createObjectURL(this.album.embeddedCover)}"
              alt="Album cover"
              class="album-cover"
            />
          `}
          <button class="play" @click=${this._onPlayClick} title="Play">
            ⏵
          </button>
        </div>
        <div class="album-info">
          <h5>${this.album.name}</h5>
          <p>${this.album.artist.name}</p>
        </div>
      </div>
    `;
  }

  private _onPlayClick() {
    this._playAlbum.run(this.album);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "library-album": LibraryAlbum;
  }
}
