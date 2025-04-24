import { StreamConsumer } from "~web/shared-controllers";
import { Library } from "@echo/core-types";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import "~web/artists";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("artist-library-page")
export class ArtistLibraryPage extends LitElement {
  private _library = new StreamConsumer(this, Library.observeArtists);

  static styles = css`
    div.loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 1rem;
    }
  `;

  render() {
    return html`
      <library-selection></library-selection>
      ${this._library.render({
        initial: () =>
          html`<div class="loading-container"><h1>Loading...</h1></div>`,
        item: (artists) =>
          artists.length > 0
            ? html`
                <div class="grid">
                  ${map(
                    artists,
                    (artist) => html`
                      <library-artist .artist=${artist}></library-artist>
                    `,
                  )}
                </div>
              `
            : html`<div class="loading-container">
                <h1>Your artists will appear here...</h1>
              </div>`,
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "artist-library": ArtistLibraryPage;
  }
}
