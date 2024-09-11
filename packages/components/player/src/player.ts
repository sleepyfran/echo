import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { Player as PlayerService, type Track } from "@echo/core-types";
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

  render() {
    return this._player.render({
      initial: () => nothing,
      item: (player) => html`
        <div>
          <h5>Player</h5>
          <div>
            ${Match.value(player.status).pipe(
              Match.tag("Playing", this._renderCurrentTrack),
              Match.tag("Paused", this._renderCurrentTrack),
              Match.orElse(() => nothing),
            )}
          </div>
          <div>
            <button ?disabled=${!player.previouslyPlayedTracks.length}>
              ⏮
            </button>
            <button
              @click=${this._onTogglePlayback}
              ?disabled=${player.status._tag !== "Paused"}
            >
              ⏵
            </button>
            <button
              @click=${this._onTogglePlayback}
              ?disabled=${player.status._tag !== "Playing"}
            >
              ⏸
            </button>
            <button ?disabled=${!player.comingUpTracks.length}>⏭</button>
          </div>
          <p>
            Previously played tracks:
            ${JSON.stringify(player.previouslyPlayedTracks)}
          </p>
          <p>Coming up tracks: ${player.comingUpTracks}</p>
        </div>
      `,
    });
  }

  private _renderCurrentTrack({ track }: { track: Track }) {
    return html`
      <h4>${track.name}</h4>
      <h5>${track.mainArtist.name}</h
    `;
  }

  private _onTogglePlayback() {
    this._togglePlayback.run({});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    ["echo-player"]: EchoPlayer;
  }
}
