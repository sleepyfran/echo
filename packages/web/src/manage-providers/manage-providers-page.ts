import { StreamConsumer } from "~web/shared-controllers";
import { MediaProviderStatus, ProviderStatus } from "@echo/core-types";
import { LitElement, css, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { Match } from "effect";
import { formatDistanceToNow } from "date-fns";
import "./signout-from-provider-button";
import "./force-sync-button";
import "~web/icons";

/**
 * Component that displays the list of providers and allows the user to add or
 * remove them.
 */
@customElement("manage-providers-page")
export class ManageProvidersPage extends LitElement {
  @state()
  dialogOpen = false;

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
      flex-wrap: wrap;
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

    .provider-status {
      display: flex;
      align-items: center;
      gap: 0.2rem;
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
                      <div class="provider-status">
                        <provider-status-icon
                          .status=${providerStatus}
                        ></provider-status-icon>
                        ${this._renderProviderStatusTag(providerStatus)}
                      </div>
                    </div>
                    <force-sync-button
                      .providerId=${providerId}
                      .providerStatus=${providerStatus}
                    ></force-sync-button>
                    <signout-from-provider-button
                      .providerId=${providerId}
                    ></signout-from-provider-button>
                  </div>
                `,
              )}
            </div>

            <echo-button @click=${this._onAddProviderClick}
              >Add more</echo-button
            >
          </div>
          ${this._renderAddProviderModal()}
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

  private _renderAddProviderModal() {
    return html`
      <add-provider-dialog
        ?open=${this.dialogOpen}
        @dismiss=${this._onAddProviderDismiss}
      ></add-provider-dialog>
    `;
  }

  private _onAddProviderClick() {
    this.dialogOpen = true;
  }

  private _onAddProviderDismiss() {
    this.dialogOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "manage-providers-page": ManageProvidersPage;
  }
}
