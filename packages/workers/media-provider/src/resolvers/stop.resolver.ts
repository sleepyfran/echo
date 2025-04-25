import { Effect, Fiber, Option, Ref } from "effect";
import {
  ProviderStatusChanged,
  type IBroadcaster,
  type ProviderId,
} from "@echo/core-types";
import type { WorkerState } from "../state";

type StopMediaProviderResolverInput = {
  providerId: ProviderId;
  broadcaster: IBroadcaster;
  workerStateRef: Ref.Ref<WorkerState>;
};

export const stopMediaProviderResolver = ({
  providerId,
  broadcaster,
  workerStateRef,
}: StopMediaProviderResolverInput) =>
  Effect.gen(function* () {
    yield* Effect.log(`Stopping media provider ${providerId}`);

    const currentWorkerState = yield* workerStateRef.get;
    const providerState = currentWorkerState.stateByProvider.get(providerId);

    if (!providerState) {
      yield* Effect.log(
        `Provider with ID ${providerId} is already stopped. Ignoring command.`,
      );
      return;
    }

    if (Option.isSome(providerState.fiber)) {
      yield* Fiber.interrupt(providerState.fiber.value);
    }

    currentWorkerState.stateByProvider.delete(providerId);
    yield* broadcaster.broadcast(
      "mediaProvider",
      new ProviderStatusChanged({
        startArgs: providerState.startArgs,
        status: { _tag: "stopped" },
      }),
    );
  });
