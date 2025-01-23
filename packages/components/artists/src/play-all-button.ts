import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shoelace-style/shoelace/dist/components/popup/popup";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown";
import "@shoelace-style/shoelace/dist/components/menu/menu";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item";
import "@echo/components-ui-atoms";
import { Player, type Album } from "@echo/core-types";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";

@customElement("play-all-button")
export class PlayAllButton extends LitElement {
  @property({ type: Array })
  albums: Album[] = [];

  private _playAlbums = new EffectFn(this, Player.playAlbums);

  static styles = css`
    sl-menu {
      background-color: var(--background-color-muted);
      box-shadow: var(--large-shadow);
    }

    sl-menu-item {
      padding: 0.5rem;
    }

    sl-menu-item:hover,
    sl-menu-item:focus-visible {
      background-color: var(--background-selected-color);
    }
  `;

  render() {
    return html`<sl-dropdown>
      <echo-button slot="trigger">Play All...</echo-button>
      <sl-menu @sl-select=${this._onPlayAll}>
        <sl-menu-item value="newest">From newest to oldest</sl-menu-item>
        <sl-menu-item value="oldest">From oldest to newest</sl-menu-item>
        <sl-menu-item value="shuffled">Shuffled</sl-menu-item>
      </sl-menu>
    </sl-dropdown>`;
  }

  private _onPlayAll(
    event: CustomEvent<{ item: { value: "newest" | "oldest" | "shuffled" } }>,
  ) {
    this._playAlbums.run({
      albums: this.albums,
      order: event.detail.item.value,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "play-all-button": PlayAllButton;
  }
}
