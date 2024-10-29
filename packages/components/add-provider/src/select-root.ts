import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { AddProviderWorkflow, type FolderMetadata } from "@echo/core-types";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@echo/components-ui-atoms";
import { ProviderStartedEvent } from "./events";
import type { ItemSelected } from "@echo/components-ui-atoms";

/**
 * Component that displays a list of available folders and allows the user to
 * select one as the root, which will start the provider upon selection.
 */
@customElement("select-root")
export class SelectRoot extends LitElement {
  @property({ type: Array })
  availableFolders: FolderMetadata[] = [];

  @property({ type: Object })
  private _selectedFolder: FolderMetadata | undefined = undefined;

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

    echo-button {
      width: 100%;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;

  render() {
    return this._selectRoot.render({
      initial: () => html`
        <h1>Select a root folder:</h1>
        <p>Select the folder where your music is stored to start syncing:</p>
        <div class="form">
          <echo-select
            @selected=${this._onSelectChange}
            placeholder="Select a folder"
            .elements=${this.availableFolders}
            displayKey="name"
          >
          </echo-select>
          <echo-button
            ?disabled=${!this._selectedFolder}
            @click=${this._onStartProvider}
          >
            ${this._selectedFolder
              ? `Start provider using ${this._selectedFolder.name}`
              : "Select a folder"}
          </echo-button>
        </div>
      `,
      pending: () => html`<h5>Connecting...</h5>`,
      complete: () => nothing,
    });
  }

  private _onSelectChange(event: ItemSelected<FolderMetadata>) {
    const [folder] = event.detail;
    this._selectedFolder = folder;
  }

  private _onStartProvider() {
    if (this._selectedFolder) {
      this._selectRoot.run(this._selectedFolder);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-root": SelectRoot;
  }
}
