import {
  AddProviderWorkflow,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { getOrCreateRuntime } from "@echo/services-bootstrap-runtime";
import { Task } from "@lit/task";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Event that gets dispatched by the component when the provider has been loaded
 * and is awaiting root folder selection.
 */
export class ProviderLoadedEvent extends Event {
  constructor(public availableFolders: FolderMetadata[]) {
    super("provider-loaded", { bubbles: true, composed: true });
  }
}

/**
 * Component that displays a list of available providers and loads them upon selection.
 */
@customElement("provider-loader")
export class ProviderLoader extends LitElement {
  @property({ type: Array })
  availableProviders: ProviderMetadata[] = [];

  private _loadProvider = new Task(this, {
    task: ([provider]: [ProviderMetadata]) =>
      getOrCreateRuntime().runPromise(
        AddProviderWorkflow.loadProvider(provider),
      ),
    autoRun: false,
  });

  private _connectToProvider = new Task(this, {
    task: () =>
      getOrCreateRuntime().runPromise(AddProviderWorkflow.connectToProvider()),
    autoRun: false,
  });

  // @ts-expect-error "Task executes automatically"
  private _notifyProviderLoaded = new Task(this, {
    args: () => [this._connectToProvider.value],
    task: ([rootFolder]) => {
      if (rootFolder) {
        this.dispatchEvent(new ProviderLoadedEvent(rootFolder));
      }
    },
  });

  render() {
    return this._connectToProvider.render({
      initial: () =>
        this._loadProvider.render({
          initial: () =>
            this.availableProviders.map(
              (provider) => html`
                <button @click=${() => this._loadProvider.run([provider])}>
                  ${provider.id}
                </button>
              `,
            ),
          complete: (providerMetadata) =>
            html`<button @click="${() => this._connectToProvider.run()}">
              Connect to ${providerMetadata.id}
            </button>`,
        }),
      pending: () => html`<h1>Connecting...</h1>`,
      complete: () => html`<h1>Connected!</h1>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-loader": ProviderLoader;
  }
}
