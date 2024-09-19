import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Component that encapsulates the default button of the application.
 */
@customElement("echo-button")
export class EchoButton extends LitElement {
  @property({ type: Boolean })
  disabled = false;

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

    button:focus {
      outline: none;
      border: 2px solid var(--border-prominent-color);
    }

    button:disabled {
      background-color: var(--disabled-background-color);
      cursor: not-allowed;
    }
  `;

  render() {
    return html`
      <button ?disabled=${this.disabled}>
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
