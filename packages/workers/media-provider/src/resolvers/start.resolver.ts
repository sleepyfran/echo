import {
  AppConfig,
  type MainThreadToMediaProviderBroadcast,
} from "@echo/core-types";
import { Effect } from "effect";

export const startMediaProviderResolver = (
  input: MainThreadToMediaProviderBroadcast["start"],
) =>
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
  });
