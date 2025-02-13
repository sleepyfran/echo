import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a play icon.
 */
@customElement("play-icon")
export class PlayIcon extends LitElement {
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
        d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z"
        fill="currentColor"
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "play-icon": PlayIcon;
  }
}
