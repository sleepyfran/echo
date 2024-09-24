import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

/**
 * Component that wraps a slot in a hoverable div that changes color on hover.
 */
@customElement("echo-hoverable")
export class Hoverable extends LitElement {
  static styles = css`
    div.hoverable {
      padding: 0.5rem;
      transition: background-color 1s;
    }

    div.hoverable:hover {
      background-color: var(--background-color-muted);
    }
  `;

  render() {
    return html`
      <div class="hoverable">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-hoverable": Hoverable;
  }
}
