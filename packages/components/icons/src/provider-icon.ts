import {
  ApiBasedProviderId,
  FileBasedProviderId,
  type ProviderId,
} from "@echo/core-types";
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
        return html`<img
          style="width: 3rem; height: 2rem;"
          src="/icons/onedrive.png"
        />`;
      case ApiBasedProviderId.Spotify:
        return html`<img
          style="width: 2rem; height: 2rem;"
          src="/icons/spotify.png"
        />`;
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
