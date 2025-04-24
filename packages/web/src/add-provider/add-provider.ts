import {
  AddProviderWorkflow,
  type ProviderMetadata,
  type RequiresRootSelectionState,
} from "@echo/core-types";
import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./provider-loader";
import "./select-root";
import { EffectConsumer } from "~web/shared-controllers";
import { Match } from "effect";
import type { ProviderWaitingForRoot } from "./events";

type ProviderStatus =
  | { _tag: "LoadingProviders" }
  | { _tag: "ProvidersLoaded"; availableProviders: ProviderMetadata[] }
  | RequiresRootSelectionState
  | { _tag: "ProviderStarted" };

/**
 * Component that displays a list of providers that can be added to the application
 * and allows the user to select one.
 */
@customElement("add-provider-dialog")
export class AddProvider extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Object })
  private _providerStatus: ProviderStatus = { _tag: "LoadingProviders" };

  updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);

    if (_changedProperties.has("open") && this.open) {
      new EffectConsumer(this, AddProviderWorkflow.availableProviders, {
        complete: (availableProviders) => {
          this._providerStatus = {
            _tag: "ProvidersLoaded",
            availableProviders,
          };
        },
      });
    }
  }

  render() {
    return html`
      <echo-dialog .open=${this.open} @dismiss=${this._onDismissClick}>
        ${Match.value(this._providerStatus).pipe(
          Match.tag(
            "LoadingProviders",
            () => html`<h1>Loading providers...</h1>`,
          ),
          Match.tag(
            "ProvidersLoaded",
            ({ availableProviders }) =>
              html`<provider-loader
                .availableProviders=${availableProviders}
                @waiting-for-root=${this._onProviderLoaded}
                @provider-started=${this._onProviderStarted}
              ></provider-loader>`,
          ),
          Match.tag(
            "WaitingForRoot",
            (state) =>
              html`<select-root
                .state=${state}
                @provider-started=${this._onProviderStarted}
              ></select-root>`,
          ),
          Match.tag(
            "ProviderStarted",
            () =>
              html`<h5>
                Provider started! Your tracks will now be scanned and added to
                your library. Check the status on the top bar for the latest
                status.
              </h5>`,
          ),
          Match.exhaustive,
        )}
      </echo-dialog>
    `;
  }

  private _onProviderLoaded(event: ProviderWaitingForRoot) {
    this._providerStatus = event.state;
  }

  private _onProviderStarted() {
    this._providerStatus = {
      _tag: "ProviderStarted",
    };
  }

  private _onDismissClick() {
    this._providerStatus = { _tag: "LoadingProviders" };
    this.dispatchEvent(new CustomEvent("dismiss"));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "add-provider-dialog": AddProvider;
  }
}
