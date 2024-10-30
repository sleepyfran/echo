import type { Album } from "@echo/core-types";
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./playable-album-cover";
import "@echo/components-icons";
import "@echo/components-ui-atoms";

/**
 * An element that displays an album from the user's library.
 */
@customElement("library-album")
export class LibraryAlbum extends LitElement {
  @property({ type: Object })
  album!: Album;

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

    div.img-wrapper:hover provider-icon {
      opacity: 1;
    }

    div.img-wrapper:hover play-album {
      opacity: 1;
    }

    play-album {
      opacity: 0;
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      transition: opacity var(--long-transition-duration);
    }

    img.album-cover {
      aspect-ratio: 1 / 1;
      border-radius: 2%;
      height: 100%;
      object-fit: cover;
      position: relative;
      width: 100%;
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

  constructor() {
    super();
  }

  render() {
    return html`
      <echo-hoverable>
        <div key="${this.album.id}" class="album-container">
          <playable-album-cover .album="${this.album}"></playable-album-cover>
          <a href="/albums/${this.album.id}">
            <div class="album-info">
              <h5>${this.album.name}</h5>
              <p>${this.album.artist.name}</p>
            </div>
          </a>
        </div>
      </echo-hoverable>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "library-album": LibraryAlbum;
  }
}
