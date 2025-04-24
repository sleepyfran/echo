import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows a slider to represent the settings of the application.
 */
@customElement("settings-icon")
export class SettingsIcon extends LitElement {
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
        d="M17 4h2v10h-2V4zm0 12h-2v2h2v2h2v-2h2v-2h-4zm-4-6h-2v10h2V10zm-8 2H3v2h2v6h2v-6h2v-2H5zm8-8h-2v2H9v2h6V6h-2V4zM5 4h2v6H5V4z"
        fill=${this.color}
      />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-icon": SettingsIcon;
  }
}
