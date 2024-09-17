import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import {
  AddProviderWorkflow,
  type FolderMetadata,
  type ProviderMetadata,
} from "@echo/core-types";
import { Match } from "effect";
import { LitElement, css, html } from "lit";
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

type LoaderStatus =
  | { _tag: "Initial" }
  | { _tag: "LoadingProvider" }
  | { _tag: "WaitingToConnect"; metadata: ProviderMetadata }
  | { _tag: "ConnectingToProvider" }
  | { _tag: "Connected" };

/**
 * Component that displays a list of available providers and loads them upon selection.
 */
@customElement("provider-loader")
export class ProviderLoader extends LitElement {
  @property()
  private _loaderStatus: LoaderStatus = { _tag: "Initial" };

  @property({ type: Array })
  availableProviders: ProviderMetadata[] = [];

  private _loadProvider = new EffectFn(
    this,
    (metadata: ProviderMetadata) => AddProviderWorkflow.loadProvider(metadata),
    {
      complete: (metadata) => {
        this._loaderStatus = { _tag: "WaitingToConnect", metadata };
      },
    },
  );

  private _connectToProvider = new EffectFn(
    this,
    () => AddProviderWorkflow.connectToProvider,
    {
      pending: () => {
        this._loaderStatus = { _tag: "ConnectingToProvider" };
      },
      complete: (rootFolder) => {
        this._loaderStatus = { _tag: "Connected" };
        this.dispatchEvent(new ProviderLoadedEvent(rootFolder));
      },
    },
  );

  static styles = css`
    .available-provider-list {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    button {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #fff;
      color: #000;
      border: 1px solid #000;
      cursor: pointer;
      font-size: 1em;
      text-transform: uppercase;
    }

    button:hover {
      background-color: #000;
      color: #fff;
    }
  `;

  render() {
    return html`
      <h1>Add provider</h1>
      ${Match.value(this._loaderStatus).pipe(
        Match.tag(
          "Initial",
          () => html`
            <p>
              These are all the currently supported providers that are available
              to add. Select one to start:
            </p>
            <div class="available-provider-list">
              ${this.availableProviders.map(
                (provider) => html`
                  <button @click=${() => this._loadProvider.run(provider)}>
                    ${provider.id}
                  </button>
                `,
              )}
            </div>
          `,
        ),
        Match.tag(
          "WaitingToConnect",
          ({ metadata }) => html`
            <button @click=${() => this._connectToProvider.run({})}>
              Connect to ${metadata.id}
            </button>
          `,
        ),
        Match.tag("LoadingProvider", () => html`<h5>Loading provider...</h5>`),
        Match.tag("ConnectingToProvider", () => html`<h5>Connecting...</h5>`),
        Match.tag("Connected", () => html`<h5>Connected!</h5>`),
        Match.exhaustive,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-loader": ProviderLoader;
  }
}
