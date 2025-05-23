import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  navigate,
  Path,
  RouteAwareController,
} from "~web/router/index.routing";
import "~web/artists";

/**
 * Component that displays tabs for the user to select whether they want to
 * see their albums, artists or genres, and options to filter the results.
 */
@customElement("library-selection")
export class LibrarySelection extends LitElement {
  private _routeController = new RouteAwareController(this);

  static styles = css`
    nav {
      display: flex;
      flex-wrap: wrap;
    }

    div.libraries {
      display: flex;
      gap: 1rem;
      padding: 1rem;
    }

    div.libraries::after {
      content: "";
      border-right: 1px solid var(--border-color);
    }

    button.pill {
      background-color: transparent;
      border: 1px solid var(--accent-color);
      color: var(--text-color);
      font-family: var(--font-family);
      border-radius: 1rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }

    button.pill:hover {
      background-color: var(--accent-color);
    }

    button.pill[active] {
      background-color: var(--accent-color);
      color: var(--button-text-color);
    }
  `;

  render() {
    return html`
      <nav>
        <div class="libraries">
          <button
            ?active=${this._routeController.matchesPath(Path.Albums)}
            class="pill"
            @click=${this._navigateToAlbums}
          >
            Albums
          </button>
          <button
            ?active=${this._routeController.matchesPath(Path.Artists)}
            class="pill"
            @click=${this._navigateToArtists}
          >
            Artists
          </button>
        </div>

        <slot></slot>
      </nav>
    `;
  }

  private _navigateToAlbums() {
    navigate(Path.Albums);
  }

  private _navigateToArtists() {
    navigate(Path.Artists);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "library-selection": LibrarySelection;
  }
}
