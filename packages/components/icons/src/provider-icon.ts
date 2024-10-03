import type { ProviderId } from "@echo/core-types";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows whichever icon represents the provider.
 */
@customElement("provider-icon")
export class ProviderIcon extends LitElement {
  @property({ type: String }) providerId!: ProviderId;
  @property({ type: Number }) size = 24;

  static styles = css`
    img {
      height: 2rem;
      object-fit: contain;
      width: 2rem;
    }
  `;

  render() {
    return html`
      <img type=${this.providerId} src="/icons/${this.providerId}.png" />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-icon": ProviderIcon;
  }
}
