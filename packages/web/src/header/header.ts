import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import "~web/command-bar";
import "~web/player";
import "~web/provider-status";

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
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
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
      overflow: hidden;
      text-overflow: ellipsis;
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
        <echo-player></echo-player>
        <command-bar></command-bar>
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
