import { StreamConsumer } from "~web/shared-controllers";
import { Library, type Artist } from "@echo/core-types";
import {
  virtualize,
  type RenderItemFunction,
} from "@lit-labs/virtualizer/virtualize.js";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { KeyFn } from "lit/directives/repeat.js";
import "~web/artists";
import { createResponsiveGridLayout } from "~web/utils";

const GRID_PADDING_PX = 4;
const ARTIST_IDEAL_ITEM_WIDTH_PX = 200;
const ARTIST_MIN_ITEM_WIDTH_PX = 160;
const ARTIST_INFO_HEIGHT_PX = 54;

/**
 * Component that displays the user's library of albums and allows them to
 * play them.
 */
@customElement("artist-library-page")
export class ArtistLibraryPage extends LitElement {
  private _library = new StreamConsumer(this, Library.observeArtists);

  @state()
  private _layout = this._createArtistGridLayout(0);

  private _resizeObserver: ResizeObserver | undefined;

  private _lastContainerWidth = 0;

  private _renderArtist: RenderItemFunction<Artist> = (artist, _index) => html`
    <div class="virtualized-item">
      <library-artist .artist=${artist}></library-artist>
    </div>
  `;

  private _artistKey: KeyFn<Artist> = (artist, _index) => String(artist.id);

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    div.loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .virtualizer-host {
      display: block;
      width: 100%;
    }

    .virtualized-item {
      box-sizing: border-box;
      display: block;
      height: 100%;
      width: 100%;
    }

    .virtualized-item > library-artist {
      display: block;
      height: 100%;
      width: 100%;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    this._resizeObserver = new ResizeObserver(([entry]) => {
      this._updateLayout(entry.contentRect.width);
    });

    this._resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;

    super.disconnectedCallback();
  }

  render() {
    return html`
      <library-selection></library-selection>
      ${this._library.render({
        initial: () =>
          html`<div class="loading-container"><h1>Loading...</h1></div>`,
        item: (artists) =>
          artists.length > 0
            ? html`
                <div class="virtualizer-host">
                  ${virtualize<Artist>({
                    items: artists,
                    layout: this._layout,
                    keyFunction: this._artistKey,
                    renderItem: this._renderArtist,
                  })}
                </div>
              `
            : html`<div class="loading-container">
                <h1>Your artists will appear here...</h1>
              </div>`,
      })}
    `;
  }

  private _updateLayout(containerWidth: number) {
    const nextContainerWidth = Math.round(containerWidth);

    if (
      nextContainerWidth === 0 ||
      nextContainerWidth === this._lastContainerWidth
    ) {
      return;
    }

    this._lastContainerWidth = nextContainerWidth;
    this._layout = this._createArtistGridLayout(nextContainerWidth);
  }

  private _createArtistGridLayout(containerWidth: number) {
    return createResponsiveGridLayout({
      containerWidth:
        containerWidth || ARTIST_IDEAL_ITEM_WIDTH_PX + GRID_PADDING_PX * 2,
      idealItemWidth: ARTIST_IDEAL_ITEM_WIDTH_PX,
      minItemWidth: ARTIST_MIN_ITEM_WIDTH_PX,
      itemHeight: (itemWidth) =>
        Math.ceil((itemWidth * 4) / 3 + ARTIST_INFO_HEIGHT_PX),
      paddingPx: GRID_PADDING_PX,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "artist-library": ArtistLibraryPage;
  }
}
