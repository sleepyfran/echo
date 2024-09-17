import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { AddProviderWorkflow, type FolderMetadata } from "@echo/core-types";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Event that gets dispatched by the component when the root has been selected
 * and the provider has started successfully.
 */
export class ProviderStartedEvent extends Event {
  constructor() {
    super("root-selected", { bubbles: true, composed: true });
  }
}

/**
 * Component that displays a list of available folders and allows the user to
 * select one as the root, which will start the provider upon selection.
 */
@customElement("select-root")
export class SelectRoot extends LitElement {
  @property({ type: Array })
  availableFolders: FolderMetadata[] = [];

  private _selectRoot = new EffectFn(
    this,
    (rootFolder: FolderMetadata) => AddProviderWorkflow.selectRoot(rootFolder),
    {
      complete: () => this.dispatchEvent(new ProviderStartedEvent()),
    },
  );

  static styles = css`
    .available-folder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10;
    }

    button {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #fff;
      color: #000;
      border: 1px solid #000;
      cursor: pointer;
      font-size: 1em;
      text-transform: uppercase;
    }

    button:hover {
      background-color: #000;
      color: #fff;
    }
  `;

  render() {
    return this._selectRoot.render({
      initial: () => html`
        <h1>Select a root folder:</h1>
        <div class="available-folder-grid">
          ${this.availableFolders.map(
            (folder) =>
              html`<button @click=${() => this._selectRoot.run(folder)}>
                ${folder.name}
              </button>`,
          )}
        </div>
      `,
      pending: () => html`<h5>Connecting...</h5>`,
      complete: () => nothing,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-root": SelectRoot;
  }
}
