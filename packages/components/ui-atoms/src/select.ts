import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Component that encapsulates the default button of the application.
 */
@customElement("echo-select")
export class EchoSelect<T = unknown> extends LitElement {
  @property({ type: Array })
  elements: T[] = [];

  @property({ type: String })
  placeholder!: string;

  @property({ type: String })
  displayKey!: keyof T;

  static styles = css`
    select {
      background-color: var(--background-color-muted);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 0.5rem;
      font-family: var(--font-family);
      font-size: 1rem;
      width: 100%;
    }
  `;

  render() {
    return html`
      <select @change=${this._onSelectChange}>
        <option value="" selected disabled>${this.placeholder}</option>
        ${this.elements.map(
          (element) =>
            html`<option value=${JSON.stringify(element)}>
              ${element[this.displayKey]}
            </option>`,
        )}
      </select>
    `;
  }

  private _onSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedValue = select.value;
    const selectedElement = JSON.parse(selectedValue) as T;
    this.dispatchEvent(
      new CustomEvent("selected", { detail: selectedElement }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-select": EchoSelect;
  }
}
