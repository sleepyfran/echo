import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { AppInit } from "@echo/core-types";
import { EffectConsumer } from "@echo/components-shared-controllers";
import "@echo/components-add-provider";
import "@echo/components-library";
import "@echo/components-player";

/**
 * Root element of the application.
 */
@customElement("app-root")
export class MyElement extends LitElement {
  private _init = new EffectConsumer(this, AppInit.init);

  render() {
    return this._init.render({
      initial: () => html`<h1>Initializing Echo...</h1>`,
      complete: () => html`
        <div>
          <add-provider></add-provider>
          <echo-player></echo-player>
          <user-library></user-library>
        </div>
      `,
      error: () =>
        html`<h3 style="color: red;">
          Ooops, something went wrong. Please report it!
        </h3>`,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": MyElement;
  }
}
