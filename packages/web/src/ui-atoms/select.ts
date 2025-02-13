import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "~web/icons";
import "@shoelace-style/shoelace/dist/components/select/select";
import "@shoelace-style/shoelace/dist/components/option/option";

export class ItemSelected<T> extends CustomEvent<
  [T | undefined, number | undefined]
> {
  constructor(
    public item: T | undefined,
    public index: number | undefined,
  ) {
    super("selected", { bubbles: true, composed: true, detail: [item, index] });
  }
}

/**
 * Component that encapsulates the default button of the application.
 */
@customElement("echo-select")
export class EchoSelect<T = unknown> extends LitElement {
  @property({ type: Array })
  elements: T[] = [];

  @property({ type: Object })
  initialValue: T | undefined;

  @property({ type: String })
  placeholder!: string;

  @property({ type: String })
  displayKey!: keyof T;

  @property({ type: Boolean })
  clearable: boolean = false;

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

    sl-select::part(display-input) {
      text-overflow: ellipsis;
    }

    sl-option::part(base) {
      padding: 0.5rem;
    }

    sl-option::part(base):hover {
      background-color: var(--background-color);
    }

    chevron-down-icon,
    cross-icon {
      display: flex;
      justify-content: center;
    }
  `;

  render() {
    return html`
      <sl-select
        placeholder=${this.placeholder}
        @sl-input=${this._onSelectChange}
        value=${this._getInitialIndex()}
        ?clearable=${this.clearable}
      >
        ${this.elements.map(
          (element, index) =>
            html`<sl-option value=${index}>
              ${this.displayKey ? element[this.displayKey] : element}
            </sl-option>`,
        )}

        <cross-icon slot="clear-icon" title="Clear filter"></cross-icon>
        <chevron-down-icon
          slot="expand-icon"
          title="Expand/collapse"
        ></chevron-down-icon>
      </sl-select>
    `;
  }

  private _getInitialIndex() {
    if (this.initialValue) {
      return this.elements.findIndex(
        (element) => element === this.initialValue,
      );
    }

    return "";
  }

  private _onSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;

    if (select.value === "") {
      this._dispatchSelectedEvent(undefined);
      return;
    }

    const selectedValue = Number(select.value);
    const selectedElement = this.elements[selectedValue];
    this._dispatchSelectedEvent(selectedElement, selectedValue);
  }

  private _dispatchSelectedEvent(
    selectedElement: T | undefined,
    index: number | undefined = undefined,
  ) {
    this.dispatchEvent(new ItemSelected(selectedElement, index));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-select": EchoSelect;
  }
}
