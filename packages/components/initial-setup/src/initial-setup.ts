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

  /**
   * We need to check if the browser supports BYOB readers because it's an
   * essential dependency for the file-based providers to work. If we don't,
   * we can't use the file-based providers.
   */
  private supportsBYOBReader = !!globalThis.ReadableStreamBYOBReader;

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

    p.partial-support-warning {
      background-color: var(--warning-color);
      padding: 1em;
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

        ${!this.supportsBYOBReader
          ? html`<p class="partial-support-warning">
              Your browser (most likely Safari) does not support an essential
              feature for file-based providers to work. You can still use other
              providers, but expect strange behavior when using providers like
              OneDrive.
            </p>`
          : ""}
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
