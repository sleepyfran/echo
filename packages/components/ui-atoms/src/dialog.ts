import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import "./button";

/**
 * Component that encapsulates the default dialog of the application.
 */
@customElement("echo-dialog")
export class EchoDialog extends LitElement {
  @query("dialog")
  private dialog!: HTMLDialogElement;

  static styles = css`
    dialog[open] {
      background-color: var(--background-color);
      border: 1px dashed var(--border-prominent-color);
      color: var(--text-color);
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
    }
  `;

  render() {
    return html`
      <dialog>
        <echo-button class="dismiss" @click=${this.dismiss}
          >Dismiss</echo-button
        >
        <slot></slot>
      </dialog>
    `;
  }

  public open() {
    this.dialog.showModal();
  }

  public dismiss() {
    this.dialog.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-dialog": EchoDialog;
  }
}
