import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  navigate,
  Path,
  RouteAwareController,
} from "@echo/components-router/index.routing";
import "@echo/components-artists";

/**
 * Component that displays tabs for the user to select whether they want to
 * see their albums, artists or genres, and options to filter the results.
 */
@customElement("library-selection")
export class LibrarySelection extends LitElement {
  private _routeController = new RouteAwareController(this);

  static styles = css`
    div {
      display: flex;
      gap: 1rem;
      padding: 1rem;
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
      <div>
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
