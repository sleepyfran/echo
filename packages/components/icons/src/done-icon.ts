import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a check-mark inside a circle.
 */
@customElement("done-icon")
export class DoneIcon extends LitElement {
  @property({ type: Number }) size = 24;
  @property({ type: String }) color = "currentColor";

  render() {
    return html`<svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${this.size} ${this.size}"
      height="${this.size}"
      width="${this.size}"
    >
      <path
        d="M17 3H7v2H5v2H3v10h2v2h2v2h10v-2h2v-2h2V7h-2V5h-2V3zm0 2v2h2v10h-2v2H7v-2H5V7h2V5h10zm-9 6h2v2h2v2h-2v-2H8v-2zm8-2h-2v2h-2v2h2v-2h2V9z"
        fill="${this.color}"
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "done-icon": DoneIcon;
  }
}
