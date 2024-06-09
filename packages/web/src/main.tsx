import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initializeWorkers } from "@echo/infrastructure-bootstrap";
import { appConfig } from "./app-config";

initializeWorkers(appConfig);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
