import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@lion/ui/define/lion-tooltip";

/**
 * Component that wraps a slot in a tooltip.
 */
@customElement("echo-tooltip")
export class Tooltip extends LitElement {
  @property({ type: String })
  content: string = "";

  static styles = css`
    .tooltip-content {
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
      <lion-tooltip>
        <div slot="invoker">
          <slot></slot>
        </div>
        <div slot="content" class="tooltip-content">${this.content}</div>
      </lion-tooltip>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-tooltip": Tooltip;
  }
}
