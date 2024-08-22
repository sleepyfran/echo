import { AppLive } from "@echo/services-bootstrap-services";
import { Rx } from "@effect-rx/rx";
import { Match } from "effect";
import { useRxValue } from "@effect-rx/rx-react";
import { MediaProviderStatus } from "@echo/core-types";

const runtime = Rx.runtime(AppLive);

const providerStatus = runtime.subscriptionRef(MediaProviderStatus.observe);

export const ProviderStatus = () => {
  const status = useRxValue(providerStatus);

  return Match.value(status).pipe(
    Match.tag("Initial", () => <pre>Loading provider status...</pre>),
    Match.tag("Success", ({ value: providerState }) => (
      <div>
        {[...providerState.entries()].map(([providerId, providerState]) => (
          <div key={providerId}>
            <h1>{providerId}</h1>
            <pre>{JSON.stringify(providerState, null, 2)}</pre>
          </div>
        ))}
      </div>
    )),
    Match.tag("Failure", () => (
      <div style={{ color: "red" }}>
        Something went wrong observing the provider statuses.
      </div>
    )),
    Match.exhaustive,
  );
};
