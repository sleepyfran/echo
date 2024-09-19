import { LitElement, css, html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import type { EchoDialog } from "@echo/components-ui-atoms";
import "@echo/components-ui-atoms";

/**
 * Component that guides the user through the initial setup of the application.
 */
@customElement("initial-setup")
export class InitialSetup extends LitElement {
  @state()
  dialogOpen = false;

  @query("echo-dialog")
  private _dialog!: EchoDialog;

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
      <echo-dialog ?open=${this.dialogOpen}>
        <add-provider></add-provider>
      </echo-dialog>
    `;
  }

  private _onAddProviderClick() {
    this._dialog.open();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "initial-setup": InitialSetup;
  }
}
