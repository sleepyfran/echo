import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { initializeWorkers } from "@echo/services-bootstrap-workers";
import { AppInit } from "@echo/core-types";
import { EffectController } from "@echo/components-shared-controllers";
import "@echo/components-add-provider";

initializeWorkers();

/**
 * Root element of the application.
 */
@customElement("app-root")
export class MyElement extends LitElement {
  private _init = new EffectController(this, AppInit.init);

  render() {
    return this._init.render({
      initial: () => html`<h1>Initializing Echo...</h1>`,
      complete: () => html`
        <div>
          <add-provider></add-provider>
          <!-- <user-library /> -->
          <!-- <provider-status /> -->
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
