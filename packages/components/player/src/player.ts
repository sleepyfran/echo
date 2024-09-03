import { StreamConsumer } from "@echo/components-shared-controllers";
import { LitElement, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { Player as PlayerService } from "@echo/core-types";

/**
 * Component that displays the current status of the player.
 */
@customElement("echo-player")
export class EchoPlayer extends LitElement {
  private _player = new StreamConsumer(this, PlayerService.observe);

  render() {
    return this._player.render({
      initial: () => nothing,
      item: (player) => html`
        <div>
          <h5>Player</h5>
          <p>Status: ${player.status}</p>
          <p>Current track: ${JSON.stringify(player.currentTrack)}</p>
          <p>
            Previously played tracks:
            ${JSON.stringify(player.previouslyPlayedTracks)}
          </p>
          <p>Coming up tracks: ${player.comingUpTracks}</p>
        </div>
      `,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    ["echo-player"]: EchoPlayer;
  }
}
