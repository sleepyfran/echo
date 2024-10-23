import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import {
  Player as PlayerService,
  type Album,
  type PlayerState,
} from "@echo/core-types";
import { Match, Option } from "effect";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";
import { ButtonType } from "@echo/components-ui-atoms";
import "@echo/components-icons";

/**
 * Component that displays the current status of the player.
 */
@customElement("echo-player")
export class EchoPlayer extends LitElement {
  private _player = new StreamConsumer(this, PlayerService.observe);
  private _togglePlayback = new EffectFn(
    this,
    () => PlayerService.togglePlayback,
  );
  private _previousTrack = new EffectFn(this, () => PlayerService.previous);
  private _skipTrack = new EffectFn(this, () => PlayerService.skip);

  static styles = css`
    .player {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .current-track {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      overflow: hidden;
    }

    .current-track img {
      border-radius: 5%;
    }

    .track-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 50%;
    }

    h4,
    h5,
    h6 {
      margin: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    h5.logo {
      font-size: 2rem;
    }
  `;

  render() {
    return this._player.render({
      initial: () => nothing,
      item: (player) => html`
        <div class="player">
          ${Match.value(player.status).pipe(
            Match.tag("Playing", (st) => this._renderActivePlayer(player, st)),
            Match.tag("Paused", (st) => this._renderActivePlayer(player, st)),
            Match.orElse(
              () => html`
                <div class="current-track">
                  <h5 class="logo">echo</h5>
                </div>
              `,
            ),
          )}
        </div>
      `,
    });
  }

  private _renderActivePlayer(
    player: PlayerState,
    { album, trackIndex }: { album: Album; trackIndex: number },
  ) {
    const track = album.tracks[trackIndex];

    return this._renderPlayer(
      player,
      album.embeddedCover,
      track.mainArtist.name,
      track.name,
    );
  }

  private _renderPlayer(
    player: PlayerState,
    cover: Album["embeddedCover"],
    artistName: string,
    trackName: string,
  ) {
    return html`
      <div id="player" class="current-track">
        ${Option.isSome(cover)
          ? html` <img
              id="current-track-cover"
              src="${URL.createObjectURL(cover.value)}"
              height="40"
              width="40"
              alt="Album cover"
            />`
          : nothing}
        <div class="track-info">
          <h4 id="track-name">${trackName}</h4>
          <h6 id="artist-name">${artistName}</h6>
        </div>
        ${player.status._tag !== "Stopped"
          ? html`
              <echo-button
                .type=${ButtonType.Icon}
                @click=${this._onPreviousTrack}
                ?disabled=${!player.allowsPrevious}
              >
                <prev-icon></prev-icon>
              </echo-button>
              <echo-button
                .type=${ButtonType.Icon}
                @click=${this._onTogglePlayback}
              >
                ${player.status._tag === "Paused"
                  ? html` <play-icon id="play"></play-icon> `
                  : html` <pause-icon id="pause"></pause-icon> `}
              </echo-button>
              <echo-button
                .type=${ButtonType.Icon}
                @click=${this._onSkipTrack}
                ?disabled=${!player.allowsNext}
              >
                <next-icon></next-icon>
              </echo-button>
            `
          : nothing}
      </div>
    `;
  }

  private _onTogglePlayback() {
    this._togglePlayback.run({});
  }

  private _onPreviousTrack() {
    this._previousTrack.run({});
  }

  private _onSkipTrack() {
    this._skipTrack.run({});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    ["echo-player"]: EchoPlayer;
  }
}
