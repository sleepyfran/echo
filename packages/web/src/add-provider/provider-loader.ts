import { EffectFn } from "~web/shared-controllers";
import { AddProviderWorkflow, type ProviderMetadata } from "@echo/core-types";
import { Match } from "effect";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ProviderStartedEvent, ProviderWaitingForRoot } from "./events";
import "~web/icons";
import { ButtonType } from "~web/ui-atoms";

type LoaderStatus =
  | { _tag: "Initial" }
  | { _tag: "Errored" }
  | { _tag: "LoadingProvider" }
  | { _tag: "WaitingToConnect"; metadata: ProviderMetadata }
  | { _tag: "ConnectingToProvider" }
  | { _tag: "Connected" };

/**
 * Component that displays a list of available providers and loads them upon selection.
 */
@customElement("provider-loader")
export class ProviderLoader extends LitElement {
  @property({ type: Object })
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
      complete: (result) => {
        this._loaderStatus = { _tag: "Connected" };
        this.dispatchEvent(
          result.requiresRootFolderSelection
            ? new ProviderWaitingForRoot(result.folders)
            : new ProviderStartedEvent(),
        );
      },
      error: () => {
        this._loaderStatus = { _tag: "Errored" };
      },
    },
  );

  static styles = css`
    .available-provider-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    echo-button > .button-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 15rem;
    }

    .error {
      color: var(--error-color);
    }
  `;

  render() {
    return html`
      <h1>Add provider</h1>
      <div class="centered">
        ${Match.value(this._loaderStatus).pipe(
          Match.tag(
            "Initial",
            () => html`
              <p>
                These are all the currently supported providers that are
                available to add. Select which one you want to add:
              </p>
              <div class="available-provider-list">
                ${this.availableProviders.map(
                  (provider) => html`
                    <echo-button
                      type=${ButtonType.Secondary}
                      @click=${() => this._loadProvider.run(provider)}
                    >
                      <div class="button-content">
                        <provider-icon
                          .providerId=${provider.id}
                        ></provider-icon>
                        ${provider.id}
                      </div>
                    </echo-button>
                  `,
                )}
              </div>
            `,
          ),
          Match.tag(
            "WaitingToConnect",
            ({ metadata }) => html`
              <p>
                Let's connect to ${metadata.id}. Clicking the button below will
                open a new window to authenticate with the provider. Echo does
                not store any of your credentials:
              </p>
              <echo-button @click=${() => this._connectToProvider.run({})}>
                Connect to ${metadata.id}
              </echo-button>
            `,
          ),
          Match.tag(
            "LoadingProvider",
            () => html`<h5>Loading provider...</h5>`,
          ),
          Match.tag("ConnectingToProvider", () => html`<h5>Connecting...</h5>`),
          Match.tag("Connected", () => html`<h5>Connected!</h5>`),
          Match.tag(
            "Errored",
            () =>
              html`<h5 class="error">
                Something went wrong... If this keeps on happening, report this!
              </h5>`,
          ),
          Match.exhaustive,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "provider-loader": ProviderLoader;
  }
}
