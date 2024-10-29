import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import {
  Library,
  type ArtistDetail as IArtistDetail,
  type ArtistId,
} from "@echo/core-types";
import { Option } from "effect";
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type RouterLocation } from "@echo/components-router/index.routing";
import { map } from "lit/directives/map.js";
import "@echo/components-albums";
import "@echo/components-ui-atoms";

/**
 * Component that displays the details of an artist.
 */
@customElement("artist-detail")
export class ArtistDetail extends LitElement {
  @property({ type: Object })
  details!: IArtistDetail;

  static styles = css`
    div.album-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
      gap: 10px;
    }

    img.artist-image {
      border-radius: 10%;
      object-fit: cover;
      aspect-ratio: 3 / 4;
      width: 15rem;
    }

    div.artist-info {
      display: flex;
      align-items: center;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
    }

    div.artist-info:after {
      content: "";
      display: block;
      width: 100%;
      height: 1px;
      background-color: var(--background-color-muted);
    }

    h5 {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    h5 {
      margin: 0;
      font-size: 1rem;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <library-selection></library-selection>
      <two-column-layout>
        <div class="artist-info" slot="left-column">
          ${Option.isSome(this.details.artist.image)
            ? html`
                <img
                  src="${URL.createObjectURL(this.details.artist.image.value)}"
                  alt=${`Image of ${this.details.artist.name}`}
                  class="artist-image"
                />
              `
            : nothing}
          <h1>${this.details.artist.name}</h1>
        </div>

        <div class="album-grid-container" slot="right-column">
          <h2>Albums</h2>
          <div class="album-grid">
            ${map(
              this.details.albums,
              (album) => html`<library-album .album=${album}></library-album>`,
            )}
          </div>
        </div>
      </two-column-layout>
    `;
  }
}

@customElement("artist-detail-page")
export class ArtistDetailPage extends LitElement {
  private _loadArtist = new EffectFn(this, Library.artistDetail);

  @property({ type: Object })
  public location!: RouterLocation;

  connectedCallback(): void {
    super.connectedCallback();

    const artistId = this.location?.params["id"] as ArtistId | undefined;
    if (artistId) {
      this._loadArtist.run(artistId);
    }
  }

  render() {
    return this._loadArtist.render({
      initial: () => html`<p>Loading...</p>`,
      complete: (details) =>
        Option.isSome(details)
          ? html`<artist-detail .details=${details.value}></artist-detail>`
          : html`<p>Artist not found</p>`,
      error: () => html`<p>There was an error loading your artist</p>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "artist-detail": ArtistDetail;
    "artist-detail-page": ArtistDetailPage;
  }
}
