import { StreamConsumer } from "@echo/components-shared-controllers";
import { Genre, Library } from "@echo/core-types";
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import "@echo/components-albums";
import { cache } from "lit/directives/cache.js";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("album-library")
export class AlbumLibrary extends LitElement {
  @state()
  private _selectedGenre: Genre | undefined;

  private _genres = new StreamConsumer(this, Library.observeGenres);

  static styles = css`
    div.filters {
      display: flex;
      align-items: center;
      padding: 0 1rem;
    }

    echo-select {
      display: block;
      position: relative;
      min-width: 25%;
      padding: 0 1rem;
      z-index: 100;
    }
  `;

  render() {
    return html`
      <div>
        ${this._genres.render({
          initial: () => nothing,
          item: (genres) =>
            genres.length > 0
              ? cache(html`
                  <div class="filters">
                    <label>Filter:</label>
                    <echo-select
                      @selected=${this._onGenreSelected}
                      placeholder="By genre"
                      .elements=${genres}
                    ></echo-select>
                  </div>
                `)
              : nothing,
        })}
        <!-- @ts-ignore -->
        <!-- The Lit linter and branded types are not best friends atm. FIXME! -->
        <genre-library-album
          .genre=${this._selectedGenre}
        ></genre-library-album>
      </div>
    `;
  }

  private _onGenreSelected(event: CustomEvent<Genre>) {
    this._selectedGenre = event.detail;
  }
}

@customElement("genre-library-album")
class GenreAlbumLibrary extends LitElement {
  @property({ type: Object })
  genre: Genre | undefined;

  static styles = css`
    div.loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      animation: blinking 1s infinite;
    }

    @keyframes blinking {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }

    div {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 1rem;
    }
  `;

  private _albums = new StreamConsumer(this, () =>
    Library.observeAlbums(this.genre ? { genre: this.genre } : undefined),
  );

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has("genre")) {
      this._albums = new StreamConsumer(this, () =>
        Library.observeAlbums(this.genre ? { genre: this.genre } : undefined),
      );
    }
  }

  render() {
    return this._albums.render({
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
    "genre-library-album": GenreAlbumLibrary;
  }
}
