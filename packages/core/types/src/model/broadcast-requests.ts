import * as S from "@effect/schema/Schema";
import {
  ProviderMetadata,
  ProviderStartArgs,
  ProviderStatus,
} from "./provider-metadata";
import { Serializable } from "@effect/schema";

/***
 * Request to start a provider, normally handled by the media provider worker.
 */
export class StartProvider extends S.Class<StartProvider>("start")({
  args: ProviderStartArgs,
}) {
  get [Serializable.symbol]() {
    return StartProvider;
  }
}

/**
 * Request to stop a running provider, normally handled by the media provider worker.
 */
export class StopProvider extends S.Class<StopProvider>("stop")({
  provider: ProviderMetadata,
}) {
  get [Serializable.symbol]() {
    return StopProvider;
  }
}

/**
 * Event emitted when the status of a provider changes.
 */
export class ProviderStatusChanged extends S.Class<ProviderStatusChanged>(
  "statusChanged",
)({
  startArgs: ProviderStartArgs,
  status: ProviderStatus,
}) {
  get [Serializable.symbol]() {
    return ProviderStatusChanged;
  }
}
