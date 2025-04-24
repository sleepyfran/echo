import { StreamConsumer } from "~web/shared-controllers";
import {
  MediaProviderStatus,
  ProviderId,
  ProviderStatus,
} from "@echo/core-types";
import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { Match } from "effect";
import { formatDistanceToNow } from "date-fns";
import "~web/icons";

/**
 * Component that displays the list of providers and allows the user to add or
 * remove them.
 */
@customElement("manage-providers-page")
export class ManageProvidersPage extends LitElement {
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  static styles = css`
    .page-container {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 1rem;
    }

    .page-container h1 {
      margin: 0;
    }

    .provider-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .provider-container {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: fit-content;
    }

    .provider-info {
      display: flex;
      flex-direction: column;
    }

    .provider-info p {
      margin: 0;
      text-transform: capitalize;
    }

    .provider-status-tag {
      text-decoration: underline;
    }
  `;

  render() {
    return html`
      <library-selection></library-selection>
      ${this._providerStatus.render({
        initial: () => nothing,
        item: (status) => html`
          <div class="page-container">
            <h1>Provider manager</h1>
            <div class="provider-list">
              ${map(
                status,
                ([providerId, providerStatus]) => html`
                  <div class="provider-container">
                    <provider-icon .providerId=${providerId}></provider-icon>
                    <div class="provider-info">
                      <p>${providerId}</p>
                      ${this._renderProviderStatusTag(providerStatus)}
                    </div>
                    <echo-button disabled type="secondary"
                      >Sync now</echo-button
                    >
                    <echo-button
                      disabled
                      @click=${() => this._onRemoveProvider(providerId)}
                    >
                      Sign out
                    </echo-button>
                  </div>
                `,
              )}
            </div>

            <echo-button @click=${this._onAddProvider}>Add more</echo-button>
          </div>
        `,
      })}
    `;
  }

  private _renderProviderStatusTag(providerStatus: ProviderStatus) {
    return html`
      <div class="provider-status-tag">
        ${Match.value(providerStatus).pipe(
          Match.tag("synced", () => "Just synced"),
          Match.tag(
            "sync-skipped",
            (status) =>
              `Last synced ${formatDistanceToNow(status.lastSyncedAt, { addSuffix: true })}`,
          ),
          Match.tag("errored", () => "Errored"),
          Match.orElse(() => "Syncing"),
        )}
      </div>
    `;
  }

  private _onRemoveProvider(_providerId: ProviderId) {
    // Handle provider removal
  }

  private _onAddProvider() {
    // Handle provider addition
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "manage-providers-page": ManageProvidersPage;
  }
}
