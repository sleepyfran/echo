import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import { AppInit, MediaProviderStatus } from "@echo/core-types";
import {
  EffectConsumer,
  StreamConsumer,
} from "@echo/components-shared-controllers";
import "@echo/components-header";
import "@echo/components-library";
import { cache } from "lit/directives/cache.js";

/**
 * Root element of the application.
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  private _init = new EffectConsumer(this, AppInit.init);
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  @query("#add-provider")
  private _addProviderDialog!: HTMLDialogElement;

  static styles = css`
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
  `;

  render() {
    return html`
      ${this._init.render({
        initial: () => html`<h1>Initializing Echo...</h1>`,
        complete: () =>
          cache(
            this._providerStatus.render({
              item: (status) =>
                status.size > 0
                  ? this._renderMainPage()
                  : html`
                      <div>
                        <h1>Welcome to Echo!</h1>
                        <p>
                          Echo is a library manager and music player that can
                          stream from a variety of different sources.
                        </p>
                        <p>To get started, add a provider:</p>
                        <button @click=${this._onAddProviderClick}>
                          Add provider
                        </button>
                      </div>
                    `,
            }),
          ),
        error: () =>
          html`<h3 style="color: red;">
            Ooops, something went wrong. Please report it!
          </h3>`,
      })}
      ${this._renderAddProviderModal()}
    `;
  }

  private _renderMainPage() {
    return html`
      <app-header></app-header>
      <user-library></user-library>
    `;
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
    "app-root": AppRoot;
  }
}
