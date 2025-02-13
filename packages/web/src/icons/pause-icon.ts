import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a pause icon.
 */
@customElement("pause-icon")
export class PauseIcon extends LitElement {
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
      <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor" />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pause-icon": PauseIcon;
  }
}
