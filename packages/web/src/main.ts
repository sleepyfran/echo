import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { AppInit, MediaProviderStatus } from "@echo/core-types";
import {
  EffectConsumer,
  StreamConsumer,
} from "@echo/components-shared-controllers";
import { cache } from "lit/directives/cache.js";
import "@echo/components-header";
import "@echo/components-initial-setup";
import "@echo/components-library";
import "@echo/components-router";

/**
 * Root element of the application.
 */
@customElement("app-root")
export class AppRoot extends LitElement {
  private _init = new EffectConsumer(this, AppInit.init);
  private _providerStatus = new StreamConsumer(
    this,
    MediaProviderStatus.observe,
  );

  render() {
    return html`
      ${this._init.render({
        initial: () => html`<h1>Initializing Echo...</h1>`,
        complete: () =>
          cache(
            this._providerStatus.render({
              item: (status) =>
                status.size > 0
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
      <library-selection></library-selection>
      <echo-router></echo-router>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
