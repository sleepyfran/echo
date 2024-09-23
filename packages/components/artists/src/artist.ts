import type { Artist } from "@echo/core-types";
import { Option } from "effect";
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * An element that displays an artist from the user's library.
 */
@customElement("library-artist")
export class LibraryArtist extends LitElement {
  @property({ type: Object })
  artist!: Artist;

  static styles = css`
    div.artist-container {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
      aspect-ratio: 3 / 4;
    }

    div.artist-container:hover {
      background-color: var(--background-color-muted);
      transition: background-color 1s;
    }

    img.artist-image {
      border-radius: 10%;
      height: 100%;
      width: 100%;
      object-fit: cover;
    }

    div.artist-info {
      cursor: pointer;
      padding: 10px;
      box-sizing: border-box;
    }

    a {
      text-decoration: none;
      color: var(--text-color);
    }

    h5 {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    h5 {
      margin: 0;
      font-size: 1rem;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <div key=${String(this.artist.id)} class="artist-container">
        ${Option.isSome(this.artist.image)
          ? html`
              <img
                src="${URL.createObjectURL(this.artist.image.value)}"
                alt=${`Image of ${this.artist.name}`}
                class="artist-image"
              />
            `
          : nothing}
        <div class="artist-info">
          <a href="/artists/${this.artist.id}"><h5>${this.artist.name}</h5></a>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "library-artist": LibraryArtist;
  }
}
