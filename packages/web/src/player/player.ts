import { StreamConsumer, EffectFn } from "~web/shared-controllers";
import { LitElement, css, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import {
  Player as PlayerService,
  type Album,
  type PlayerState,
  type Track,
} from "@echo/core-types";
import { Match, Option } from "effect";
import { ButtonType } from "~web/ui-atoms";
import "~web/icons";
import { classMap } from "lit/directives/class-map.js";

/**
 * Component that displays the current status of the player.
 */
@customElement("echo-player")
export class EchoPlayer extends LitElement {
  private _player = new StreamConsumer(this, PlayerService.observe, {
    item: (playerState) => {
      /*
      This pattern matches against the player state and dispatches custom events
      that can be used to react to changes in the playing/stopped state of the player.

      This is not really meant to be used in the app itself, but mostly to
      properly broadcast the player state to external components that might need
      it, like WebScrobbler to scrobble tracks.
      */
      Match.value(playerState.status).pipe(
        Match.tag("Loading", () => {}),
        Match.tag("Playing", ({ album, trackIndex }) => {
          const track = album.tracks[trackIndex];
          this.dispatchEvent(
            new CustomEvent("track-playing", {
              detail: {
                trackName: track.name,
                artistName: album.artist.name,
                albumName: album.name,
                providerId: track.resource.provider,
              },
            }),
          );
        }),
        Match.tag("Paused", "Stopped", () => {
          this.dispatchEvent(new CustomEvent("track-paused"));
        }),
        Match.exhaustive,
      );
    },
  });
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
      justify-content: space-between;
      gap: 0.5rem;
      overflow: hidden;
      width: 100%;
    }

    .current-track img {
      border-radius: 5%;
    }

    .pulsating {
      animation: color-pulse 1s ease-out infinite;
    }

    @keyframes color-pulse {
      0% {
        color: var(--primary-text-color);
      }
      50% {
        color: var(--accent-color);
      }
      100% {
        color: var(--primary-text-color);
      }
    }

    .track-info {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
      max-width: calc(100% - 10rem);
    }

    .track-details {
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: calc(100% - 1rem);
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

    .playback-buttons {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
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
                <div
                  class=${classMap({
                    "current-track": true,
                    "current-track-logo": true,
                    pulsating: player.status._tag === "Loading",
                  })}
                >
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
    return this._renderPlayer(player, album, track);
  }

  private _renderPlayer(player: PlayerState, album: Album, track: Track) {
    return html`
      <div id="player" class="current-track">
        <div class="track-info">
          ${Option.isSome(album.embeddedCover)
            ? html` <img
                id="current-track-cover"
                src="${URL.createObjectURL(album.embeddedCover.value)}"
                height="40"
                width="40"
                alt="Album cover"
              />`
            : nothing}
          <div class="track-details">
            <h4 id="track-name" title=${track.name}>${track.name}</h4>
            <h6 id="artist-name" title=${track.mainArtist.name}>
              ${track.mainArtist.name}
            </h6>
          </div>
        </div>
        ${player.status._tag !== "Stopped"
          ? html`
              <div class="playback-buttons">
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
              </div>
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
