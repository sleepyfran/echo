import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagedRuntime } from "effect";
import { createContext, type PropsWithChildren, useContext, useRef } from "react";
import { runtime, type EchoRuntimeServices } from "@echo/services-bootstrap-runtime";

type RuntimeContext = {
  runtime: ManagedRuntime.ManagedRuntime<EchoRuntimeServices, never>;
};

const RuntimeContext = createContext<RuntimeContext>({} as RuntimeContext);

/**
 * Context provider that provides the app's Effect runtime and the Query client
 * for using query/commands that interact with the runtime.
 */
export const RuntimeProvider = ({ children }: PropsWithChildren) => {
  const queryClientRef = useRef(new QueryClient());
  return (
    <RuntimeContext.Provider
      value={{
        runtime,
      }}
    >
      <QueryClientProvider client={queryClientRef.current}>
        {children}
      </QueryClientProvider>
    </RuntimeContext.Provider>
  );
};

/**
 * Hook that provides the app's Effect runtime
 */
export const useRuntime = () => useContext(RuntimeContext).runtime;
