import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import "@echo/components-ui-atoms";

/**
 * Component that guides the user through the initial setup of the application.
 */
@customElement("initial-setup")
export class InitialSetup extends LitElement {
  @query("#add-provider")
  private _addProviderDialog!: HTMLDialogElement;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    div.initial-setup {
      max-width: 40%;
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
      <div class="initial-setup">
        <h1>Welcome to Echo!</h1>
        <p>
          Echo is a library manager and music player that can stream from a
          variety of different sources. To get started, you need to add a
          provider
        </p>
        <echo-button @click=${this._onAddProviderClick}
          >Add provider</echo-button
        >
      </div>
      ${this._renderAddProviderModal()}
    `;
  }

  private _renderAddProviderModal() {
    return html`
      <dialog id="add-provider">
        <echo-button
          class="dismiss"
          @click=${() => this._addProviderDialog.close()}
        >
          x
        </echo-button>
        <add-provider></add-provider>
      </dialog>
    `;
  }

  private _onAddProviderClick() {
    this._addProviderDialog.showModal();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "initial-setup": InitialSetup;
  }
}
