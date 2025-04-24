import {
  MediaProviderStatus,
  type ProviderId,
  type ProviderStatus,
} from "@echo/core-types";
import { StreamConsumer } from "~web/shared-controllers";
import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { Match } from "effect";
import { ButtonType } from "~web/ui-atoms";
import "~web/icons";
import "~web/add-provider";
import { navigate, Path } from "~web/router/routing";

/**
 * Component that displays the status of all active providers.
 */
@customElement("all-providers-status-bar")
export class AllProvidersStatusBar extends LitElement {
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  static styles = css`
    .provider-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin: 0.5rem 0;
      gap: 1rem;
    }

    .provider-status {
      position: relative;
    }

    .provider-status-icon {
      position: absolute;
      bottom: -5px;
      right: -5px;
    }

    .error-icon {
      color: var(--error-color);
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
                  <provider-status-icon
                    class="provider-status-icon"
                    .status=${providerStatus}
                  ></provider-status-icon>
                </div>
              </echo-tooltip>
            `,
          )}
          <echo-button
            .type=${ButtonType.Icon}
            @click=${this._onManageProvidersClick}
          >
            <settings-icon title="Manage providers"></settings-icon>
          </echo-button>
        </div>
      `,
      complete: () => nothing,
      error: () => nothing,
    });
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

  private _onManageProvidersClick() {
    navigate(Path.Settings);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "all-provider-status-bar": AllProvidersStatusBar;
  }
}
