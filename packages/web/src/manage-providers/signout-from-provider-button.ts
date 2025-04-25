import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MediaProviderManager, type ProviderId } from "@echo/core-types";
import { EffectFn } from "~web/shared-controllers";

@customElement("signout-from-provider-button")
export class SignOutFromProviderButton extends LitElement {
  @property({ type: String })
  providerId!: ProviderId;

  private _removeProvider = new EffectFn(this, () =>
    MediaProviderManager.signOut(this.providerId),
  );

  render() {
    return this._removeProvider.render({
      initial: () => this._renderButton(false),
      pending: () => this._renderButton(true),
      complete: () => this._renderButton(false),
      error: () => this._renderButton(false),
    });
  }

  private _renderButton(disabled: boolean) {
    return html`
      <echo-button @click=${this._onRemoveProvider} ?disabled=${disabled}>
        Sign out
      </echo-button>
    `;
  }

  private _onRemoveProvider() {
    this._removeProvider.run({});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "signout-from-provider-button": SignOutFromProviderButton;
  }
}
