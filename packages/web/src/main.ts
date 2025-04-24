import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ActiveMediaProviderCache, AppInit } from "@echo/core-types";
import { EffectConsumer, StreamConsumer } from "~web/shared-controllers";
import { cache } from "lit/directives/cache.js";
import "~web/header";
import "~web/initial-setup";
import "~web/library";
import "~web/router";

/**
 * Root element of the application.
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  private _init = new EffectConsumer(this, AppInit.init);
  private _activeProviders = new StreamConsumer(
    this,
    ActiveMediaProviderCache.observe,
  );

  static styles = css`
    .initializing {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `;

  render() {
    return this._init.render({
      pending: () => this._renderInitializingMessage(),
      complete: () =>
        cache(
          this._activeProviders.render({
            item: (activeProviders) =>
              activeProviders.length > 0
                ? this._renderMainPage()
                : html`<initial-setup></initial-setup>`,
          }),
        ),
      error: () =>
        html`<h3 style="color: red;">
          Ooops, something went wrong. Please report it!
        </h3>`,
    });
  }

  private _renderInitializingMessage() {
    return html`
      <div class="initializing">
        <h1>Re-initializing Echo...</h1>
      </div>
    `;
  }

  private _renderMainPage() {
    return html`
      <app-header></app-header>
      <echo-router></echo-router>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
