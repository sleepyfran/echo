import { StreamConsumer } from "~web/shared-controllers";
import { Genre, Library } from "@echo/core-types";
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import "~web/albums";
import { cache } from "lit/directives/cache.js";
import type { ItemSelected } from "~web/ui-atoms";

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("album-library-page")
export class AlbumLibraryPage extends LitElement {
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

  connectedCallback(): void {
    super.connectedCallback();

    // Check if the user was previously browsing a specific genre (URL contains
    // a genre query string parameter).
    const url = new URL(window.location.href);
    const genre = url.searchParams.get("genre");
    if (genre) {
      this._selectedGenre = genre as Genre;
    }
  }

  render() {
    return html`
      <div>
        <library-selection>
          ${this._genres.render({
            initial: () => nothing,
            item: (genres) =>
              genres.length > 0
                ? cache(html`
                    <!-- @ts-ignore -->
                    <!-- The Lit linter and branded types are not best friends atm. FIXME! -->
                    <div class="filters">
                      <label>Filter:</label>
                      <echo-select
                        clearable
                        @selected=${this._onGenreSelected}
                        placeholder="By genre"
                        .initialValue=${this._selectedGenre}
                        .elements=${genres}
                      ></echo-select>
                    </div>
                  `)
                : nothing,
          })}
        </library-selection>

        <!-- @ts-ignore -->
        <!-- The Lit linter and branded types are not best friends atm. FIXME! -->
        <genre-library-album
          .genre=${this._selectedGenre}
        ></genre-library-album>
      </div>
    `;
  }

  private _onGenreSelected(event: ItemSelected<Genre>) {
    const [selectedGenre] = event.detail;
    this._selectedGenre = selectedGenre;

    // Add the genre as a QSP so that the user can browse back to the same
    // view.
    const url = new URL(window.location.href);
    if (this._selectedGenre) {
      url.searchParams.set("genre", this._selectedGenre);
    } else {
      url.searchParams.delete("genre");
    }

    window.history.pushState({}, "", url.toString());
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
    }

    div.loading-container.animated {
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

    .grid {
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
        html`<div class="loading-container animated">
          <h1>Loading library...</h1>
        </div>`,
      item: (albums) =>
        albums.length > 0
          ? html`
              <div class="grid">
                ${map(
                  albums,
                  (album) => html`
                    <library-album .album=${album}></library-album>
                  `,
                )}
              </div>
            `
          : html`<div class="loading-container">
              <h1>Your albums will appear here...</h1>
            </div>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "album-library": AlbumLibraryPage;
    "genre-library-album": GenreAlbumLibrary;
  }
}
