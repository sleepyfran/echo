import * as S from "@effect/schema/Schema";
import {
  ProviderId,
  ProviderMetadata,
  ProviderStartArgs,
  ProviderStatus,
} from "./provider-metadata";
import { Serializable } from "@effect/schema";
import { AuthenticationInfo } from "./authentication";

/***
 * Request to start a provider, normally handled by the media provider worker.
 */
export class StartProvider extends S.TaggedClass<StartProvider>(
  "@echo/broadcast-request/StartProvider",
)("StartProvider", {
  args: ProviderStartArgs,
}) {
  get [Serializable.symbol]() {
    return StartProvider;
  }
}

/**
 * Request to forcefully sync a provider, normally handled by the media
 * provider worker.
 */
export class ForceSyncProvider extends S.TaggedClass<ForceSyncProvider>(
  "@echo/broadcast-request/ForceSyncProvider",
)("ForceSyncProvider", {
  args: ProviderStartArgs,
}) {
  get [Serializable.symbol]() {
    return ForceSyncProvider;
  }
}

/**
 * Request to stop a running provider, normally handled by the media provider worker.
 */
export class StopProvider extends S.TaggedClass<StopProvider>(
  "@echo/broadcast-request/StopProvider",
)("StopProvider", {
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

/**
 * Event emitted when the authentication info of a provider has been refreshed.
 */
export class ProviderAuthInfoChanged extends S.Class<ProviderAuthInfoChanged>(
  "providerAuthInfoChanged",
)({
  providerId: ProviderId,
  authInfo: AuthenticationInfo,
}) {
  get [Serializable.symbol]() {
    return ProviderAuthInfoChanged;
  }
}
