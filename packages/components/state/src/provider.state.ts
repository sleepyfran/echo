import { useOnMountEffect } from "@echo/components-effect-bridge";
import {
  MediaProviderMainThreadBroadcastChannel,
  type MediaProviderBroadcastSchema,
  type ProviderMetadata,
  type ProviderStatus,
} from "@echo/core-types";
import { MainLive } from "@echo/infrastructure-bootstrap";
import { Effect, Fiber } from "effect";
import { atom, useAtom } from "jotai";
import { useCallback, useRef } from "react";

/**
 * State derived from the provider status that is shared via the broadcast
 * channel.
 */
export type ProviderState = {
  status: ProviderStatus;
};

/**
 * Map of provider ID to the state of the provider.
 */
export type StateByProvider = Map<ProviderMetadata["id"], ProviderState>;

const stateAtom = atom<StateByProvider>(new Map());
const writableProviderStateAtom = atom(
  null,
  (_, set, input: { metadata: ProviderMetadata; status: ProviderStatus }) => {
    set(stateAtom, (currentMap) => {
      const updatedMap = new Map(currentMap);
      updatedMap.set(input.metadata.id, {
        status: input.status,
      });
      return updatedMap;
    });
  },
);

/**
 * Atom that holds the state of the provider. This state is shared across the
 * application and derived from the provider status shared via the broadcast
 * channel.
 */
export const providerStateAtom = atom((get) => [...get(stateAtom).entries()]);

/**
 * Hook that subscribes to the provider state and populates the atom's value
 * with it. This hook does not return anything, but it will listen to provider
 * state updates done through the broadcast channel and update the atom's value.
 * In order to actually use the provider state, you should use the atom itself.
 */
export const useProviderStateSubscriber = () => {
  const [_, setProviderState] = useAtom(writableProviderStateAtom);
  const listener = useCallback(
    (
      update: MediaProviderBroadcastSchema["mainThread"]["resolvers"]["reportStatus"],
    ) => {
      setProviderState({
        metadata: update.metadata,
        status: update.status,
      });
    },
    [setProviderState],
  );
  const _effect = useRef<ReturnType<
    typeof createProviderStatusListener
  > | null>(null);
  if (_effect.current === null) {
    _effect.current = createProviderStatusListener(listener);
  }

  useOnMountEffect(_effect.current!);
};

const createProviderStatusListener = (
  listener: (
    update: MediaProviderBroadcastSchema["mainThread"]["resolvers"]["reportStatus"],
  ) => void,
) =>
  Effect.gen(function* () {
    const broadcastChannel = yield* MediaProviderMainThreadBroadcastChannel;

    // TODO: Move somewhere else.
    const reportStatusFiber = yield* broadcastChannel.registerResolver(
      "reportStatus",
      (status) => {
        listener(status);
        return Effect.void;
      },
    );

    // TODO: Is this safe? Does this produce any leaks?
    yield* Fiber.join(reportStatusFiber);
  }).pipe(Effect.provide(MainLive));
