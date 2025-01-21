import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shoelace-style/shoelace/dist/components/popup/popup";
import { Library, type Album, type Artist } from "@echo/core-types";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Option } from "effect";

/**
 * Component that displays a search bar that can search in the user's library
 * and execute commands.
 */
@customElement("command-bar")
export class CommandBar extends LitElement {
  @state()
  private resultsVisible = false;

  @state()
  private searchResults: [Album[], Artist[]] = [[], []];

  private previousSearchTimeout: NodeJS.Timeout | undefined;

  private search = new EffectFn(this, Library.search, {
    complete: (results) => {
      this.searchResults = results;
      this.resultsVisible = true;
    },
  });

  static styles = css`
    input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      background-color: var(--background-color-muted);
      color: var(--text-color);
      font-family: "DepartureMono", monospace;
      font-size: 1rem;
      outline: none;
      width: 95%;
    }

    input:focus {
      border-color: var(--accent-color);
    }

    div.search-results {
      background-color: var(--background-color-muted);
      box-shadow: var(--large-shadow);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    // Listen for the Escape key to close the search bar.
    window.addEventListener("keydown", (event) => this._onKeyDown(event));
    window.addEventListener("mousedown", (event) => this._onMouseDown(event));
  }

  render() {
    return html`
      <sl-popup ?active=${this.resultsVisible} placement="bottom" sync="width">
        <input
          slot="anchor"
          placeholder="Search or command"
          @input="${this._onQueryChanged}"
          @focus="${() => (this.resultsVisible = true)}"
        />

        <div class="search-results">
          ${this.searchResults[0].map(
            (album) => html`
              <command-bar-result
                title="${album.name}"
                subtitle="${album.artist.name}"
                .imageSource="${album.embeddedCover}"
                link="/albums/${album.id}"
                @click="${this._onOptionSelected}"
              ></command-bar-result>
            `,
          )}
          ${this.searchResults[1].map(
            (artist) => html`
              <command-bar-result
                title="${artist.name}"
                subtitle=""
                .imageSource="${artist.image}"
                rounded
                link="/artists/${artist.id}"
                @click="${this._onOptionSelected}"
              ></command-bar-result>
            `,
          )}
        </div>
      </sl-popup>
    `;
  }

  private _onQueryChanged(event: Event) {
    const query = (event.target as HTMLInputElement).value;

    if (this.previousSearchTimeout) {
      clearTimeout(this.previousSearchTimeout);
    }

    this.previousSearchTimeout = setTimeout(() => {
      this.search.run(query);
    }, 200);
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.resultsVisible = false;
    }
  }

  private _onMouseDown(event: MouseEvent) {
    const elementPath = event.composedPath();
    const popup = this.shadowRoot?.querySelector("sl-popup") as HTMLElement;

    // Close the search results if the user clicks outside of the popup.
    // `composedPath` returns a list of all elements that the event will pass
    // through, so if the popup is not in the path, the user clicked outside.
    if (!elementPath.includes(popup)) {
      this.resultsVisible = false;
    }
  }

  private _onOptionSelected() {
    this.resultsVisible = false;
  }
}

@customElement("command-bar-result")
class CommandBarResult extends LitElement {
  @property({ type: String })
  title = "";

  @property({ type: String })
  subtitle = "";

  @property({ type: Object })
  imageSource: Option.Option<Blob> = Option.none();

  @property({ type: String })
  link = "";

  @property({ type: Boolean })
  rounded = false;

  static styles = css`
    a {
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 1rem;
      text-decoration: none;
      color: inherit;
      padding: 0.5rem;
    }

    a:hover {
      background-color: var(--background-selected-color);
    }

    img {
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
    }

    img.rounded {
      border-radius: 50%;
    }

    .info {
      display: flex;
      flex-direction: column;
      max-width: calc(100% - 5rem);
    }

    .info > * {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  render() {
    return html`
      <a href=${this.link}>
        ${Option.isSome(this.imageSource) &&
        html`
          <img
            class="${this.rounded ? "rounded" : ""}"
            src="${URL.createObjectURL(this.imageSource.value)}"
            alt="${this.title}"
          />
        `}
        <div class="info">
          <h4>${this.title}</h4>
          <p>${this.subtitle}</p>
        </div>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "command-bar": CommandBar;
    "command-bar-result": CommandBarResult;
  }
}
