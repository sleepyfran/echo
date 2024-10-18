import {
  MediaProviderStatus,
  type ProviderId,
  type ProviderStatus,
} from "@echo/core-types";
import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, css, html, nothing } from "lit";
import { customElement, query } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { Match } from "effect";
import { ButtonType, type EchoDialog } from "@echo/components-ui-atoms";
import "@echo/components-icons";
import "@echo/components-add-provider";
import "@echo/components-ui-atoms";

/**
 * Component that displays the status of all active providers.
 */
@customElement("all-providers-status-bar")
export class AllProvidersStatusBar extends LitElement {
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  @query("echo-dialog")
  private _dialog!: EchoDialog;

  static styles = css`
    .provider-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin: 0.5rem 0;
    }

    .provider-status {
      position: relative;
    }

    .provider-status-icon {
      position: absolute;
      bottom: -5px;
      right: -5px;
    }

    .syncing-icon {
      animation: blinking 1s infinite;
    }

    .error-icon {
      color: var(--error-color);
    }

    @keyframes blinking {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  `;

  render() {
    return this._providerStatus.render({
      initial: () => nothing,
      item: (status) => html`
        <div class="provider-container">
          ${map(
            status,
            ([providerId, providerStatus]) => html`
              <echo-tooltip
                content=${this._providerStatusTitle(providerId, providerStatus)}
              >
                <div class="provider-status">
                  <provider-icon .providerId=${providerId}></provider-icon>
                  ${this._renderProviderStatus(providerStatus)}
                </div>
              </echo-tooltip>
            `,
          )}
          <echo-button
            .type=${ButtonType.Icon}
            @click=${this._onAddProviderClick}
          >
            <plus-icon title="Add provider"></plus-icon>
          </echo-button>
        </div>
        ${this._renderAddProviderModal()}
      `,
      complete: () => nothing,
      error: () => nothing,
    });
  }

  private _renderProviderStatus(providerStatus: ProviderStatus) {
    return Match.value(providerStatus).pipe(
      Match.tag(
        "syncing",
        () =>
          html`<sync-icon
            class="provider-status-icon syncing-icon"
          ></sync-icon>`,
      ),
      Match.tag(
        "synced",
        "sync-skipped",
        () => html`<done-icon class="provider-status-icon"></done-icon>`,
      ),
      Match.tag(
        "errored",
        () =>
          html`<cross-icon
            class="provider-status-icon error-icon"
          ></cross-icon>`,
      ),
      Match.orElse(() => nothing),
    );
  }

  private _providerStatusTitle(
    providerId: ProviderId,
    providerStatus: ProviderStatus,
  ) {
    return Match.value(providerStatus).pipe(
      Match.tag(
        "synced",
        (status) =>
          `${providerId} has finished syncing. Synced ${status.syncedTracks} tracks`,
      ),
      Match.tag(
        "sync-skipped",
        () =>
          `${providerId} has skipped syncing because it was updated recently`,
      ),
      Match.tag(
        "errored",
        () => `${providerId} has encountered an error while syncing`,
      ),
      Match.orElse(() => `Syncing ${providerId}`),
    );
  }

  private _renderAddProviderModal() {
    return html`
      <echo-dialog>
        <add-provider></add-provider>
      </echo-dialog>
    `;
  }

  // --- Event handlers ---
  private _onAddProviderClick() {
    this._dialog.open();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "all-provider-status-bar": AllProvidersStatusBar;
  }
}
