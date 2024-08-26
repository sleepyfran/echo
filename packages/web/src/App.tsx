import { AddProvider } from "@echo/components-add-provider";
import { UserLibrary } from "@echo/components-library";
import { ProviderStatus } from "@echo/components-provider-status";
import { AppInit } from "@echo/core-types";
import { AppInitLive } from "@echo/services-app-init";
import { MainLive } from "@echo/services-bootstrap";
import { Rx } from "@effect-rx/rx";
import { useRx } from "@effect-rx/rx-react";
import { Layer, Match } from "effect";
import { useEffect } from "react";

const runtime = Rx.runtime(AppInitLive.pipe(Layer.provide(MainLive)));
const appInitRx = runtime.fn(() => AppInit.init);

export const App = () => {
  const [initStatus, init] = useRx(appInitRx);

  useEffect(init, [init]);

  return Match.value(initStatus).pipe(
    Match.tag("Initial", () => <h1>Initializing Echo...</h1>),
    Match.tag("Success", () => (
      <div>
        <AddProvider />
        <UserLibrary />
        <ProviderStatus />
      </div>
    )),
    Match.tag("Failure", () => (
      <h3 style={{ color: "red" }}>
        Ooops, something went wrong. Please report it!
      </h3>
    )),
    Match.exhaustive,
  );
};
