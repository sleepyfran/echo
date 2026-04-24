import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shoelace-style/shoelace/dist/components/popup/popup";
import { Keyboard, Library, type Album, type Artist } from "@echo/core-types";
import { EffectFn, StreamConsumer } from "~web/shared-controllers";
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
  private selectedResultIndex = -1;

  @state()
  private searchResults: [Album[], Artist[]] = [[], []];

  private previousSearchTimeout: NodeJS.Timeout | undefined;

  private readonly _handleWindowKeyDown = (event: KeyboardEvent) =>
    this._onWindowKeyDown(event);

  private readonly _handleWindowMouseDown = (event: MouseEvent) =>
    this._onWindowMouseDown(event);

  private search = new EffectFn(this, Library.search, {
    complete: (results) => {
      this.searchResults = results;
      this.resultsVisible = true;
      this.selectedResultIndex = -1;
    },
  });

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }

    .input-container {
      position: relative;
      width: 100%;
    }

    sl-popup {
      width: 100%;
    }

    input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      background-color: var(--background-color-muted);
      color: var(--text-color);
      font-family: "DepartureMono", monospace;
      font-size: 1rem;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }

    input:focus {
      border-color: var(--accent-color);
    }

    .keyboard-hint {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      margin-top: 3px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      opacity: 0.2;
      pointer-events: none;
      font-family: "DepartureMono", monospace;
      font-size: 16px;
    }

    .keyboard-hint span {
      margin-bottom: 5px;
    }

    div.search-results {
      background-color: var(--background-color-muted);
      box-shadow: var(--large-shadow);
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    new StreamConsumer(this, Keyboard.observeEvent("command-bar:open"), {
      item: () => {
        this.resultsVisible = true;
        const input = this.shadowRoot?.querySelector("input");
        input?.focus();
      },
    });

    // Listen for the Escape key to close the search bar.
    window.addEventListener("keydown", this._handleWindowKeyDown);
    window.addEventListener("mousedown", this._handleWindowMouseDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    window.removeEventListener("keydown", this._handleWindowKeyDown);
    window.removeEventListener("mousedown", this._handleWindowMouseDown);
  }

  render() {
    return html`
      <sl-popup ?active=${this.resultsVisible} placement="bottom" sync="width">
        <div slot="anchor" class="input-container">
          <input
            placeholder="Search or command"
            @input="${this._onQueryChanged}"
            @keydown="${this._onInputKeyDown}"
            @focus="${() => (this.resultsVisible = true)}"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="${this.resultsVisible}"
            aria-controls="command-bar-results"
            aria-activedescendant=${this._activeDescendantId}
          />
          <div class="keyboard-hint">
            <command-icon size="16"></command-icon>
            <span>+</span>
            <span>K</span>
          </div>
        </div>

        <div id="command-bar-results" class="search-results" role="listbox">
          ${this.searchResults[0].map(
            (album, index) => html`
              <command-bar-result
                id="${this._resultId(index)}"
                title="${album.name}"
                subtitle="${album.artist.name}"
                .imageSource="${album.embeddedCover}"
                link="/albums/${album.id}"
                ?active="${this.selectedResultIndex === index}"
                aria-selected="${this.selectedResultIndex === index}"
                role="option"
                @click="${this._onOptionSelected}"
              ></command-bar-result>
            `,
          )}
          ${this.searchResults[1].map((artist, index) => {
            const resultIndex = this.searchResults[0].length + index;

            return html`
              <command-bar-result
                id="${this._resultId(resultIndex)}"
                title="${artist.name}"
                subtitle=""
                .imageSource="${artist.image}"
                rounded
                link="/artists/${artist.id}"
                ?active="${this.selectedResultIndex === resultIndex}"
                aria-selected="${this.selectedResultIndex === resultIndex}"
                role="option"
                @click="${this._onOptionSelected}"
              ></command-bar-result>
            `;
          })}
        </div>
      </sl-popup>
    `;
  }

  private _onQueryChanged(event: Event) {
    const query = (event.target as HTMLInputElement).value;

    if (this.previousSearchTimeout) {
      clearTimeout(this.previousSearchTimeout);
    }

    this.selectedResultIndex = -1;

    this.previousSearchTimeout = setTimeout(() => {
      this.search.run(query);
    }, 200);
  }

  private _onWindowKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.resultsVisible = false;
      this.selectedResultIndex = -1;
    }
  }

  private _onInputKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this._selectNextResult();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this._selectPreviousResult();
    }

    if (event.key === "Enter" && this.selectedResultIndex >= 0) {
      event.preventDefault();
      this._openSelectedResult();
    }
  }

  private _onWindowMouseDown(event: MouseEvent) {
    const elementPath = event.composedPath();
    const popup = this.shadowRoot?.querySelector("sl-popup") as HTMLElement;

    // Close the search results if the user clicks outside of the popup.
    // `composedPath` returns a list of all elements that the event will pass
    // through, so if the popup is not in the path, the user clicked outside.
    if (!elementPath.includes(popup)) {
      this.resultsVisible = false;
      this.selectedResultIndex = -1;
    }
  }

  private _onOptionSelected() {
    this.resultsVisible = false;
    this.selectedResultIndex = -1;
  }

  private _selectNextResult() {
    const resultCount = this._resultCount;

    if (resultCount === 0) {
      return;
    }

    this.resultsVisible = true;
    this.selectedResultIndex = (this.selectedResultIndex + 1) % resultCount;
  }

  private _selectPreviousResult() {
    const resultCount = this._resultCount;

    if (resultCount === 0) {
      return;
    }

    this.resultsVisible = true;
    this.selectedResultIndex =
      this.selectedResultIndex <= 0
        ? resultCount - 1
        : this.selectedResultIndex - 1;
  }

  private _openSelectedResult() {
    const result =
      this.shadowRoot?.querySelectorAll<CommandBarResult>("command-bar-result")[
        this.selectedResultIndex
      ];

    result?.open();
  }

  private _resultId(index: number) {
    return `command-bar-result-${index}`;
  }

  private get _activeDescendantId() {
    if (this.selectedResultIndex < 0) {
      return nothing;
    }

    return this._resultId(this.selectedResultIndex);
  }

  private get _resultCount() {
    return this.searchResults[0].length + this.searchResults[1].length;
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

  @property({ type: Boolean, reflect: true })
  active = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    a {
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 1rem;
      text-decoration: none;
      color: inherit;
      padding: 0.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    a:hover,
    :host([active]) a {
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
        ${Option.isSome(this.imageSource)
          ? html`
              <img
                class="${this.rounded ? "rounded" : ""}"
                src="${URL.createObjectURL(this.imageSource.value)}"
                alt="${this.title}"
              />
            `
          : nothing}
        <div class="info">
          <h4>${this.title}</h4>
          <p>${this.subtitle}</p>
        </div>
      </a>
    `;
  }

  public open() {
    this.shadowRoot?.querySelector("a")?.click();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "command-bar": CommandBar;
    "command-bar-result": CommandBarResult;
  }
}
