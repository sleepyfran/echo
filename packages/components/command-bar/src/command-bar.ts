import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

/**
 * Component that displays a search bar that can search in the user's library
 * and execute commands.
 */
@customElement("command-bar")
export class CommandBar extends LitElement {
  static styles = css`
    input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      background-color: var(--background-color-muted);
      font-size: 1rem;
      width: 80%;
    }

    input::placeholder {
      font-family: "DepartureMono", monospace;
    }
  `;

  render() {
    return html`<input placeholder="Search or command (f)" />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "command-bar": CommandBar;
  }
}
