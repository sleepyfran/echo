import { MediaProviderStatus } from "@echo/core-types";
import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";

/**
 * Component that displays the status of all active providers.
 */
@customElement("provider-status")
export class ProviderStatus extends LitElement {
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  render() {
    return this._providerStatus.render({
      initial: () => html`<p>Retrieving syncing status...</p>`,
      item: (status) =>
        map(
          status,
          ([providerId, providerStatus]) => html`
            <h4>${providerId}</h4>
            <pre>${JSON.stringify(providerStatus, null, 2)}</pre>
          `,
        ),
      complete: () => html`<p>Complete</p>`,
      error: (error) => html`<p style="{ color: 'red' }">Error: ${error}</p>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-status": ProviderStatus;
  }
}
