import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Defines the types of buttons that can be used.
 */
export enum ButtonType {
  Regular = "regular",
  Secondary = "secondary",
  Icon = "icon",
}

/**
 * Component that encapsulates the default button of the application.
 */
@customElement("echo-button")
export class EchoButton extends LitElement {
  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  type: ButtonType = ButtonType.Regular;

  static styles = css`
    button {
      display: flex;
      height: 100%;
      align-items: center;
      justify-content: center;
      background-color: var(--button-background-color);
      color: var(--button-text-color);
      font-family: var(--font-family);
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      transition: background-color var(--short-transition-duration);
    }

    button:hover {
      background-color: var(--button-hover-background-color);
    }

    button:disabled {
      background-color: var(--disabled-background-color);
      cursor: not-allowed;
    }

    button[type="icon"] {
      background: none;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      height: 1.5rem;
      padding: 0;
      transition: color var(--short-transition-duration);
    }

    button[type="icon"]:hover {
      color: var(--accent-color);
    }

    button[type="icon"]:disabled {
      color: var(--disabled-background-color);
      cursor: not-allowed;
    }

    button[type="secondary"] {
      background-color: transparent;
      border: 2px solid var(--button-background-color);
      color: var(--button-background-color);
    }

    button[type="secondary"]:hover {
      background-color: var(--button-background-color);
      color: var(--button-text-color);
    }

    button:focus {
      outline: none;
      border: 2px solid var(--border-prominent-color);
    }
  `;

  render() {
    return html`
      <button type=${this.type} ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-button": EchoButton;
  }
}
