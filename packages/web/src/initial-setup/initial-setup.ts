import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "~web/ui-atoms";

/**
 * Component that guides the user through the initial setup of the application.
 */
@customElement("initial-setup")
export class InitialSetup extends LitElement {
  @state()
  dialogOpen = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    div.initial-setup {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      height: 60vh;
      max-width: 40%;
    }

    div.initial-setup echo-button {
      align-self: center;
    }

    div.initial-setup::after {
      content: "";
      display: block;
      height: 1px;
      background-color: var(--border-color);
      margin-top: 5rem;
      margin-bottom: 5rem;
    }

    div.hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 80%;
      padding-bottom: 5rem;
    }

    @media (max-width: 1000px) {
      div.hero-grid {
        grid-template-columns: 1fr;
      }
    }

    div.hero-grid img {
      align-self: center;
      border-radius: 5px;
      width: 80%;
    }

    div.hero-grid div {
      display: flex;
      flex-direction: column;
    }

    p.partial-support-warning {
      background-color: var(--warning-color);
      padding: 1em;
    }

    a {
      color: var(--button-background-color);
    }
  `;

  render() {
    return html`
      <div class="initial-setup">
        <h1>Welcome to Echo!</h1>
        <p>
          Echo is a library manager and music player that can stream from a
          variety of different sources. To get started, you need to add a
          provider
        </p>
        <echo-button @click=${this._onAddProviderClick}
          >Add provider</echo-button
        >
      </div>
      ${this._renderHero()} ${this._renderAddProviderModal()}
    `;
  }

  private _renderHero() {
    return html`
      <div class="hero-grid">
        <div>
          <h2>What's on the other side?</h2>
          <img src="/img/hero.jpg" />
        </div>

        <div class="faq">
          <div>
            <h2>Which providers are supported?</h2>
            <p>Currently Echo supports these providers:</p>
            <ul>
              <li>OneDrive</li>
              <li>Spotify</li>
            </ul>
            <p>
              Feel free to request new ones
              <a
                href="https://github.com/sleepyfran/echo/issues"
                target="_blank"
                >here</a
              >.
            </p>
          </div>

          <div>
            <h2>How does it work?</h2>
            <p>
              Echo syncs your library with the provider to get the metadata and
              stores it in its local database. Whenever you play then it's up to
              the provider to stream the audio, for file-based providers like
              OneDrive, Echo streams the audio file directly, while for
              protected ones like Spotify it uses Spotify's API to stream the
              audio.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private _renderAddProviderModal() {
    return html`
      <add-provider-dialog
        .open=${this.dialogOpen}
        @dismiss=${this._onAddProviderDismiss}
      ></add-provider-dialog>
    `;
  }

  private _onAddProviderClick() {
    this.dialogOpen = true;
  }

  private _onAddProviderDismiss() {
    this.dialogOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "initial-setup": InitialSetup;
  }
}
