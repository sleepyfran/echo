import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import {
  Player as PlayerService,
  type PlayerState,
  type Track,
} from "@echo/core-types";
import { Match } from "effect";
import { EffectFn } from "@echo/components-shared-controllers/src/effect-fn.controller";

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
    }

    .track-info h5 {
      margin: 0;
    }

    h5 {
      margin: 0;
    }

    h5.logo {
      font-size: 2rem;
    }
  `;

  render() {
    return this._player.render({
      initial: () => nothing,
      item: (player) => html`
        <div>
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
    { track }: { track: Track },
  ) {
    return this._renderPlayer(
      player,
      track.albumInfo.embeddedCover,
      track.mainArtist.name,
      track.name,
    );
  }

  private _renderPlayer(
    player: PlayerState,
    cover: Blob | undefined,
    artistName: string,
    trackName: string,
  ) {
    return html`
      <div class="current-track">
        ${cover
          ? html` <img
              src="${URL.createObjectURL(cover!)}"
              height="40"
              width="40"
              alt="Album cover"
            />`
          : nothing}
        <h5>${trackName} - ${artistName}</h5>
        ${player.status._tag !== "Stopped"
          ? html`
              <button
                @click=${this._onPreviousTrack}
                ?disabled=${!player.previouslyPlayedTracks.length}
              >
                ⏮
              </button>
              <button @click=${this._onTogglePlayback}>
                ${player.status._tag === "Paused" ? "⏵" : "⏸"}
              </button>
              <button
                @click=${this._onSkipTrack}
                ?disabled=${!player.comingUpTracks.length}
              >
                ⏭
              </button>
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
