import { EffectFnController } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { AddProviderWorkflow, type FolderMetadata } from "@echo/core-types";
import { LitElement, html, nothing } from "lit";
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

  private _selectRoot = new EffectFnController(
    this,
    (rootFolder: FolderMetadata) => AddProviderWorkflow.selectRoot(rootFolder),
    {
      complete: () => this.dispatchEvent(new ProviderStartedEvent()),
    },
  );

  render() {
    return this._selectRoot.render({
      initial: () => html`
        <h1>Select a root folder:</h1>
        ${this.availableFolders.map(
          (folder) =>
            html`<button @click=${() => this._selectRoot.run(folder)}>
              ${folder.name}
            </button>`,
        )}
      `,
      pending: () => html`<h1>Connecting...</h1>`,
      complete: () => nothing,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-root": SelectRoot;
  }
}
