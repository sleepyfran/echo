import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import "@echo/components-command-bar";
import "@echo/components-player";
import "@echo/components-provider-status";

/**
 * Component that displays the header of the app, which includes the command
 * bar, the main player and the provider status.
 */
@customElement("app-header")
export class Header extends LitElement {
  @query("header")
  private _header!: HTMLElement;

  static styles = css`
    header {
      background-color: var(--background-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      position: sticky;
      top: 0;
      transition: box-shadow 0.6s;
      z-index: 1000;
    }

    header.shadowed {
      box-shadow: var(--large-shadow);
    }

    header > * {
      flex: 1;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        this._header.classList.add("shadowed");
      } else {
        this._header.classList.remove("shadowed");
      }
    });
  }

  render() {
    return html`
      <header>
        <command-bar></command-bar>
        <echo-player></echo-player>
        <all-providers-status-bar></all-providers-status-bar>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-header": Header;
  }
}
