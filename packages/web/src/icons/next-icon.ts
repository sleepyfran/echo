import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a next icon.
 */
@customElement("next-icon")
export class NextIcon extends LitElement {
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
        d="M6 4h2v2h2v2h2v2h2v4h-2v2h-2v2H8v2H6V4zm12 0h-2v16h2V4z"
        fill="currentColor"
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "next-icon": NextIcon;
  }
}
