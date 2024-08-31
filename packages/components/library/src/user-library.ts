import { StreamConsumer } from "@echo/components-shared-controllers";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Library, Player } from "@echo/core-types";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("user-library")
export class UserLibrary extends LitElement {
  private _library = new StreamConsumer(this, Library.observeAlbums);
  private _playAlbum = new EffectFn(this, Player.playAlbum);

  render() {
    return this._library.render({
      initial: () => html`<h1>Loading...</h1>`,
      item: (albums) => html`
        <div>
          <br />
          ${map(
            albums,
            (album) => html`
              <div key="{album.id}">
                ${album.base64EmbeddedCover &&
                html`
                  <img
                    src="data:image/png;base64, ${album.base64EmbeddedCover}"
                    height="100"
                    width="100"
                    alt="Album cover"
                  />
                `}
                <h3>${album.name}</h3>
                <p>${album.artist.name}</p>
                <button @click=${() => this._playAlbum.run(album)}>Play</button>
                <hr />
              </div>
            `,
          )}
        </div>
      `,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    userLibrary: UserLibrary;
  }
}
