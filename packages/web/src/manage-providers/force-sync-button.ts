import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  MediaProviderManager,
  ProviderStatus,
  type ProviderId,
} from "@echo/core-types";
import { EffectFn } from "~web/shared-controllers";

@customElement("force-sync-button")
export class ForceSyncButton extends LitElement {
  @property({ type: String })
  providerId!: ProviderId;

  @property({ type: Object })
  providerStatus!: ProviderStatus;

  private _forceSync = new EffectFn(this, () =>
    MediaProviderManager.forceSync(this.providerId),
  );

  render() {
    return this._forceSync.render({
      initial: () => this._renderButton(false),
      pending: () => this._renderButton(true),
      complete: () => this._renderButton(false),
      error: () => this._renderButton(false),
    });
  }

  private _renderButton(disabled: boolean) {
    return html`
      <echo-button
        type="secondary"
        @click=${this._onForceSync}
        ?disabled=${this.providerStatus._tag === "syncing" || disabled}
      >
        Sync now</echo-button
      >
    `;
  }

  private _onForceSync() {
    this._forceSync.run({});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "force-sync-button": ForceSyncButton;
  }
}
