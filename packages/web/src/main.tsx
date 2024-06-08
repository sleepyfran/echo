import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initializeMediaProviderWorker } from "@echo/workers-media-provider";
import { appConfig } from "./app-config";

// TODO: Move to the bootstrap package.
initializeMediaProviderWorker(appConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
