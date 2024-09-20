import { FileBasedProviderId, type ProviderId } from "@echo/core-types";
import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Icon that shows whichever icon represents the provider.
 */
@customElement("provider-icon")
export class ProviderIcon extends LitElement {
  @property({ type: String }) providerId!: ProviderId;
  @property({ type: Number }) size = 24;

  render() {
    switch (this.providerId) {
      case FileBasedProviderId.OneDrive:
        return html`<onedrive-icon size=${this.size}></onedrive-icon>`;
      // TODO: Add Spotify icon once we support it.
      default:
        return nothing;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-icon": ProviderIcon;
  }
}
