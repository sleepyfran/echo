import { LitElement, html } from "lit";
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

  render() {
    return html`
      ${this._init.render({
        initial: () => html`<h1>Initializing Echo...</h1>`,
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
      })}
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
