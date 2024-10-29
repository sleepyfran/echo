import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { Genre, Library, type Album, type AlbumId } from "@echo/core-types";
import { Option } from "effect";
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  Path,
  type RouterLocation,
  navigate,
} from "@echo/components-router/index.routing";
import { map } from "lit/directives/map.js";
import "@echo/components-ui-atoms";
import "./playable-album-cover";

/**
 * Component that displays the details of an album.
 */
@customElement("album-detail")
export class AlbumDetail extends LitElement {
  @property({ type: Object })
  album!: Album;

  static styles = css`
    ol.track-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    img.album-image {
      border-radius: 10%;
      height: 20rem;
      object-fit: cover;
    }

    div.album-info {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    div.album-info:after {
      content: "";
      display: block;
      width: 100%;
      height: 1px;
      background-color: var(--background-color-muted);
    }

    a {
      text-decoration: none;
      color: var(--text-color);
    }

    h5 {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    h5 {
      margin: 0;
      padding-bottom: 1rem;
      font-size: 1rem;
    }

    h6 {
      margin: 0;
      padding-bottom: 1rem;
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    div.genres {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    div.genres > .genre {
      cursor: pointer;
      border: 1px solid var(--accent-color);
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition:
        background-color var(--short-transition-duration),
        color var(--short-transition-duration);
    }

    div.genres > .genre:hover {
      background-color: var(--accent-color);
      color: var(--background-color);
    }

    div.track {
      display: flex;
      justify-content: space-between;
    }

    div.track > .duration {
      color: var(--secondary-text-color);
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <two-column-layout>
        <div class="album-info" slot="left-column">
          <playable-album-cover
            .album=${this.album}
            detailsAlwaysVisible
          ></playable-album-cover>
          <h1>${this.album.name}</h1>
          <h5>
            <a href="/artists/${this.album.artist.id}"
              >${this.album.artist.name}</a
            >
            ${Option.isSome(this.album.releaseYear)
              ? html`(${this.album.releaseYear.value})`
              : nothing}
          </h5>
          <h6>${this._formatAlbumDuration()}</h6>
          <div class="genres">${this._renderGenres()}</div>
        </div>

        <div class="track-list-container" slot="right-column">
          <h2>Tracks</h2>
          <ol class="track-list">
            ${map(
              this.album.tracks,
              (track) =>
                html`<div class="track">
                  <li>${track.name}</li>
                  <span class="duration"
                    >${this._formatDuration(track.durationInSeconds)}</span
                  >
                </div>`,
            )}
          </ol>
        </div>
      </two-column-layout>
    `;
  }

  private _formatDuration(durationInSeconds: number): string {
    if (durationInSeconds === 0) return "";

    const date = new Date(0);
    date.setSeconds(durationInSeconds);
    return date.toLocaleTimeString("en-US", {
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private _formatAlbumDuration(): string {
    const durationInSeconds = this.album.tracks.reduce(
      (acc, track) => acc + track.durationInSeconds,
      0,
    );
    const durationInMinutes = Math.floor(durationInSeconds / 60);
    return `${durationInMinutes} min`;
  }

  private _renderGenres() {
    return this.album.genres.map(
      (genre) =>
        html`<span class="genre" @click=${() => this._navigateToGenre(genre)}
          >${genre}</span
        >`,
    );
  }

  private _navigateToGenre(genre: Genre) {
    navigate(Path.Albums, [["genre", genre]]);
  }
}

@customElement("album-detail-page")
export class AlbumDetailPage extends LitElement {
  private _loadAlbum = new EffectFn(this, Library.albumDetail);

  @property({ type: Object })
  public location!: RouterLocation;

  connectedCallback(): void {
    super.connectedCallback();

    const albumId = this.location?.params["id"] as AlbumId | undefined;
    if (albumId) {
      this._loadAlbum.run(albumId);
    }
  }

  render() {
    return this._loadAlbum.render({
      initial: () => html`<p>Loading...</p>`,
      complete: (details) =>
        Option.isSome(details)
          ? html`<album-detail .album=${details.value}></album-detail>`
          : html`<p>Album not found</p>`,
      error: () => html`<p>There was an error loading your album</p>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "album-detail": AlbumDetail;
    "album-detail-page": AlbumDetailPage;
  }
}
