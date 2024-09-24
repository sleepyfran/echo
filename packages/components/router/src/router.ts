import { LitElement, html, type PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import { Router } from "@vaadin/router";
import "@echo/components-library";

/**
 * Top-level router element that manages the application's routing.
 */
@customElement("echo-router")
export class EchoRouter extends LitElement {
  firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    const router = new Router(this.shadowRoot?.getElementById("outlet"));
    router.setRoutes([
      {
        path: "/",
        children: [
          { path: "", component: "album-library" },
          { path: "/albums/:id", component: "album-detail-page" },
          { path: "/artists", component: "artist-library" },
          { path: "/artists/:id", component: "artist-detail-page" },
        ],
      },
    ]);
  }

  render() {
    return html`<div id="outlet"></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "echo-router": EchoRouter;
  }
}
