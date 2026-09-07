import { isAuthenticationResponse } from "./is-authentication-response";

if (isAuthenticationResponse(window.location)) {
  void import("@echo/infrastructure-onedrive-provider/redirect-bridge")
    .then(({ broadcastResponseToMainFrame }) => broadcastResponseToMainFrame())
    .catch((error: unknown) => {
      console.error(
        "Failed to process the Microsoft authentication response",
        error,
      );
    });
} else {
  void import("./main");
}
