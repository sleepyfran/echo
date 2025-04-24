import { Match } from "effect";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ProviderStatus } from "packages/core/types";

@customElement("provider-status-icon")
export class ProviderStatusIcon extends LitElement {
  @property({ type: Object })
  status!: ProviderStatus;

  static styles = css`
    .syncing-icon {
      animation: blinking 1s infinite;
    }

    @keyframes blinking {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  `;

  render() {
    return Match.value(this.status).pipe(
      Match.tag(
        "syncing",
        () => html`<sync-icon class="syncing-icon"></sync-icon>`,
      ),
      Match.tag("synced", "sync-skipped", () => html`<done-icon></done-icon>`),
      Match.tag(
        "errored",
        () => html`<cross-icon class="error-icon"></cross-icon>`,
      ),
      Match.orElse(() => nothing),
    );
  }
}
