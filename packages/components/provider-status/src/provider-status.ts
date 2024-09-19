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
import "@echo/components-icons";
import "@echo/components-add-provider";

/**
 * Component that displays the status of all active providers.
 */
@customElement("all-providers-status-bar")
export class AllProvidersStatusBar extends LitElement {
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  @query("#add-provider")
  private _addProviderDialog!: HTMLDialogElement;

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
      right: 5px;
    }

    .syncing-icon {
      animation: blinking 1s infinite;
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
      height: 50%;
      width: 50%;
    }

    dialog[open]::backdrop {
      background-color: rgb(0 0 0 / 75%);
    }

    dialog .dismiss {
      align-self: flex-end;
      padding: 0.5rem;
      font-size: 1.5rem;
      background: none;
      border: none;
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
              <div
                class="provider-status"
                title=${this._providerStatusTitle(providerId, providerStatus)}
              >
                ${this._renderProviderIcon(providerId)}
                ${this._renderProviderStatus(providerStatus)}
              </div>
            `,
          )}
          <button @click=${this._onAddProviderClick}>+</button>
        </div>
        ${this._renderAddProviderModal()}
      `,
      complete: () => nothing,
      error: () => nothing,
    });
  }

  private _renderProviderIcon(providerId: ProviderId) {
    switch (providerId) {
      case "onedrive":
        return html`<onedrive-icon size="32"></onedrive-icon>`;
      default:
        return nothing;
    }
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
        () => html`<done-icon class="provider-status-icon"></done-icon>`,
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
          `${providerId} has finished syncing. Synced ${status.syncedFiles} files`,
      ),
      Match.orElse(() => `Syncing ${providerId}`),
    );
  }

  private _renderAddProviderModal() {
    return html`
      <dialog id="add-provider">
        <button class="dismiss" @click=${() => this._addProviderDialog.close()}>
          x
        </button>
        <add-provider></add-provider>
      </dialog>
    `;
  }

  // --- Event handlers ---
  private _onAddProviderClick() {
    this._addProviderDialog.showModal();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "all-provider-status-bar": AllProvidersStatusBar;
  }
}
