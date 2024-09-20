import { StreamConsumer } from "@echo/components-shared-controllers";
import { Library } from "@echo/core-types";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import "@echo/components-artists";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("artist-library")
export class ArtistLibrary extends LitElement {
  private _library = new StreamConsumer(this, Library.observeArtists);

  static styles = css`
    div.loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    div {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 1rem;
    }
  `;

  render() {
    return this._library.render({
      initial: () =>
        html`<div class="loading-container"><h1>Loading...</h1></div>`,
      item: (artists) => html`
        <div>
          ${map(
            artists,
            (artist) => html`
              <library-artist .artist=${artist}></library-artist>
            `,
          )}
        </div>
      `,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "artist-library": ArtistLibrary;
  }
}
