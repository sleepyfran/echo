import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shoelace-style/shoelace/dist/components/select/select";
import "@shoelace-style/shoelace/dist/components/option/option";

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
    sl-select::part(combobox) {
      background-color: var(--background-color-muted);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 0.5rem;
      font-family: var(--font-family);
      font-size: 1rem;
      width: 100%;
    }

    sl-select::part(listbox) {
      background-color: var(--background-color-muted);
      display: flex;
      flex-direction: column;
    }

    sl-option::part(base) {
      padding: 0.5rem;
    }

    sl-option::part(base):hover {
      background-color: var(--background-color);
    }
  `;

  render() {
    return html`
      <sl-select
        placeholder=${this.placeholder}
        @sl-input=${this._onSelectChange}
      >
        ${this.elements.map(
          (element, index) =>
            html`<sl-option value=${index}>
              ${this.displayKey ? element[this.displayKey] : element}
            </sl-option>`,
        )}
      </sl-select>
    `;
  }

  private _onSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedValue = Number(select.value);
    const selectedElement = this.elements[selectedValue];
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
