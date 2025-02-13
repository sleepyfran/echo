import {
  AddProviderWorkflow,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./provider-loader";
import "./select-root";
import { EffectConsumer } from "~web/shared-controllers";
import { Match } from "effect";
import type { ProviderWaitingForRoot } from "./events";

type ProviderStatus =
  | { _tag: "LoadingProviders" }
  | { _tag: "ProvidersLoaded"; availableProviders: ProviderMetadata[] }
  | { _tag: "WaitingForRootFolderSelection"; folders: FolderMetadata[] }
  | { _tag: "ProviderStarted" };

/**
 * Component that displays a list of providers that can be added to the application
 * and allows the user to select one.
 */
@customElement("add-provider")
export class AddProvider extends LitElement {
  @property({ type: Object })
  private _providerStatus: ProviderStatus = { _tag: "LoadingProviders" };

  connectedCallback(): void {
    super.connectedCallback();

    new EffectConsumer(this, AddProviderWorkflow.availableProviders, {
      complete: (availableProviders) => {
        this._providerStatus = {
          _tag: "ProvidersLoaded",
          availableProviders,
        };
      },
    });
  }

  render() {
    return Match.value(this._providerStatus).pipe(
      Match.tag("LoadingProviders", () => html`<h1>Loading providers...</h1>`),
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
        "WaitingForRootFolderSelection",
        ({ folders }) =>
          html`<select-root
            .availableFolders=${folders}
            @provider-started=${this._onProviderStarted}
          ></select-root>`,
      ),
      Match.tag(
        "ProviderStarted",
        () =>
          html`<h5>
            Provider started! Your tracks will now be scanned and added to your
            library. Check the status on the top bar for the latest status.
          </h5>`,
      ),
      Match.exhaustive,
    );
  }

  private _onProviderLoaded(event: ProviderWaitingForRoot) {
    this._providerStatus = {
      _tag: "WaitingForRootFolderSelection",
      folders: event.availableFolders,
    };
  }

  private _onProviderStarted() {
    this._providerStatus = {
      _tag: "ProviderStarted",
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "add-provider": AddProvider;
  }
}
