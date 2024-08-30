import {
  AddProviderWorkflow,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { Task } from "@lit/task";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getOrCreateRuntime } from "@echo/services-bootstrap-runtime";
import type { ProviderLoadedEvent } from "./provider-loader";
import "@echo/components-provider-status";
import "./provider-loader";
import "./select-root";

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

  // @ts-expect-error "Task executes automatically"
  private _availableProvidersTask = new Task(this, {
    task: () =>
      getOrCreateRuntime()
        .runPromise(AddProviderWorkflow.availableProviders)
        .then((availableProviders) => {
          this._providerStatus = {
            _tag: "ProvidersLoaded",
            availableProviders,
          };
        }),
    args: () => [],
  });

  render() {
    return this._providerStatus._tag === "LoadingProviders"
      ? html`<h1>Loading providers...</h1>`
      : this._providerStatus._tag === "ProvidersLoaded"
        ? html`<provider-loader
            .availableProviders=${this._providerStatus.availableProviders}
            @provider-loaded=${this._onProviderLoaded}
          ></provider-loader>`
        : this._providerStatus._tag === "WaitingForRootFolderSelection"
          ? html`<select-root
              .availableFolders=${this._providerStatus.folders}
              @root-selected=${this._onRootSelected}
            ></select-root>`
          : html`<provider-status></provider-status>`;
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
