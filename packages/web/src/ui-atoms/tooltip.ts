import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shoelace-style/shoelace/dist/components/popup/popup";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip";

/**
 * Component that wraps a slot in a tooltip.
 */
@customElement("echo-tooltip")
export class Tooltip extends LitElement {
  @property({ type: String })
  content: string = "";

  static styles = css`
    sl-tooltip::part(body) {
      padding: 0.5rem;
      background-color: var(--button-background-color);
      border: 1px solid var(--background-color-muted);
      border-radius: 0.5rem;
      color: var(--button-text-color);
    }

    .arrow {
      background-color: var(--button-background-color);
    }
  `;

  render() {
    return html`
      <sl-tooltip content=${this.content} arrow>
        <slot></slot>
      </sl-tooltip>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-tooltip": Tooltip;
  }
}
