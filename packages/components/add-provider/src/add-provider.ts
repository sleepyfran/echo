import {
  AddProviderWorkflow,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ProviderLoadedEvent } from "./provider-loader";
import "@echo/components-provider-status";
import "./provider-loader";
import "./select-root";
import { EffectController } from "@echo/components-shared-controllers";
import { Match } from "effect";

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
  @property()
  private _providerStatus: ProviderStatus = { _tag: "LoadingProviders" };

  connectedCallback(): void {
    super.connectedCallback();

    new EffectController(this, AddProviderWorkflow.availableProviders, {
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
            @provider-loaded=${this._onProviderLoaded}
          ></provider-loader>`,
      ),
      Match.tag(
        "WaitingForRootFolderSelection",
        ({ folders }) =>
          html`<select-root
            .availableFolders=${folders}
            @root-selected=${this._onRootSelected}
          ></select-root>`,
      ),
      Match.tag(
        "ProviderStarted",
        () => html`<provider-status></provider-status>`,
      ),
      Match.exhaustive,
    );
  }

  private _onProviderLoaded(event: ProviderLoadedEvent) {
    this._providerStatus = {
      _tag: "WaitingForRootFolderSelection",
      folders: event.availableFolders,
    };
  }

  private _onRootSelected() {
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
