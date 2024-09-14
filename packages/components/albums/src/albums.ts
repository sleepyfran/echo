import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Player, type Album } from "@echo/core-types";
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * An element that displays an album from the user's library.
 */
@customElement("library-album")
export class LibraryAlbum extends LitElement {
  @property({ type: Object })
  album!: Album;

  private _playAlbum = new EffectFn(this, Player.playAlbum);

  static styles = css`
    :host {
      display: block;
      padding: 10px;
      border: 1px solid #000;
      background-color: #fff;
      color: #000;
    }

    img {
      border-radius: 4px;
    }

    h3 {
      margin: 0;
      font-size: 1.2em;
      color: #000;
      white-space: normal;
      word-break: break-all;
      overflow: visible;
    }

    p {
      margin: 0;
      color: #000;
      font-size: 1em;
    }

    button {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #fff;
      color: #000;
      border: 1px solid #000;
      cursor: pointer;
      font-size: 1em;
      text-transform: uppercase;
    }

    button:hover {
      background-color: #000;
      color: #fff;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <div key="{album.id}">
        ${this.album.embeddedCover &&
        html`
          <img
            src="${URL.createObjectURL(this.album.embeddedCover)}"
            height="100"
            width="100"
            alt="Album cover"
          />
        `}
        <h3>${this.album.name}</h3>
        <p>${this.album.artist.name}</p>
        <button @click=${this._onPlayClick}>Play</button>
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
