import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a cross.
 */
@customElement("cross-icon")
export class CrossIcon extends LitElement {
  @property({ type: Number }) size = 24;
  @property({ type: String }) color = "currentColor";

  render() {
    return html`<svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox=${`0 0 ${this.size} ${this.size}`}
      height=${this.size}
      width=${this.size}
    >
      <path
        d="M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z"
        fill="currentColor"
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cross-icon": CrossIcon;
  }
}
