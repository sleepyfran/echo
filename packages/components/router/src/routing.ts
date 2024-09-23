import { Router, type RouterLocation } from "@vaadin/router";
import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Enum representing the different paths in the application.
 */
export enum Path {
  Albums = "/",
  Artists = "/artists",
}

/**
 * Navigates the user to the specified path.
 */
export const navigate = (path: Path) => {
  Router.go(path);
};

/**
 * Controller that listens to route changes and exposes the current path and
 * some utility methods to work with it.
 */
export class RouteAwareController implements ReactiveController {
  private _host: ReactiveControllerHost;

  /**
   * The current path of the application.
   */
  public path: Path = Path.Albums;

  constructor(host: ReactiveControllerHost) {
    (this._host = host).addController(this);
    this.path = window.location.pathname as Path;
  }

  hostConnected(): void {
    window.addEventListener("vaadin-router-go", this._onRouteChange.bind(this));
  }

  hostDisconnected(): void {
    window.removeEventListener("vaadin-router-go", this._onRouteChange);
  }

  matchesPath(path: Path): boolean {
    return this.path === path;
  }

  private _onRouteChange(event: Event) {
    const pathName =
      (event as CustomEvent).detail.pathname ?? window.location.pathname;

    this.path = pathName as Path;
    this._host.requestUpdate();
  }
}

export { Router, type RouterLocation };
