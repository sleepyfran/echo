import type { RequiresRootSelectionState } from "@echo/core-types";

/**
 * Event that gets dispatched by the component when the root has been selected
 * and the provider has started successfully.
 */
export class ProviderStartedEvent extends Event {
  constructor() {
    super("provider-started", { bubbles: true, composed: true });
  }
}

/**
 * Event that gets dispatched by the component when the provider has been loaded
 * and is awaiting root folder selection.
 */
export class ProviderWaitingForRoot extends Event {
  constructor(public state: RequiresRootSelectionState) {
    super("waiting-for-root", { bubbles: true, composed: true });
  }
}
