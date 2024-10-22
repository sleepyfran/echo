import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

/**
 * Component that encapsulates a two-column layout.
 */
@customElement("two-column-layout")
export class TwoColumnLayout extends LitElement {
  static styles = css`
    div.container {
      display: flex;
      padding-bottom: 2rem;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      padding: 1rem 5rem;
      box-sizing: border-box;
      width: 40%;
    }

    .right-column {
      padding-right: 5rem;
      width: 80%;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="left-column">
          <slot name="left-column"></slot>
        </div>
        <div class="right-column">
          <slot name="right-column"></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "two-column-layout": TwoColumnLayout;
  }
}
