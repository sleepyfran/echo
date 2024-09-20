import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Defines the types of buttons that can be used.
 */
export enum ButtonType {
  Regular = "regular",
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

    button[icon-only] {
      background: none;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      height: 1.5rem;
      padding: 0;
      transition: color var(--short-transition-duration);
    }

    button[icon-only]:hover {
      color: var(--accent-color);
    }

    button[icon-only]:disabled {
      color: var(--disabled-background-color);
      cursor: not-allowed;
    }

    button:focus {
      outline: none;
      border: 2px solid var(--border-prominent-color);
    }
  `;

  render() {
    return html`
      <button
        ?icon-only=${this.type === ButtonType.Icon}
        ?disabled=${this.disabled}
      >
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
