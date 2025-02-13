import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a chevron pointing down.
 */
@customElement("chevron-down-icon")
export class ChevronDownIcon extends LitElement {
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
        d="M7 8H5v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2v2h-2v2h-2v2h-2v-2H9v-2H7V8z"
        fill="currentColor"
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chevron-down-icon": ChevronDownIcon;
  }
}
