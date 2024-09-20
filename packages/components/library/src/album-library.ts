import { StreamConsumer } from "@echo/components-shared-controllers";
import { Library } from "@echo/core-types";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import "@echo/components-albums";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("album-library")
export class AlbumLibrary extends LitElement {
  private _library = new StreamConsumer(this, Library.observeAlbums);

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
      item: (albums) => html`
        <div>
          ${map(
            albums,
            (album) => html` <library-album .album=${album}></library-album> `,
          )}
        </div>
      `,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "album-library": AlbumLibrary;
  }
}
