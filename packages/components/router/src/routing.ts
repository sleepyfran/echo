import { Router } from "@vaadin/router";

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

export { Router };
