import { describe, expect, it } from "vitest";
import { isAuthenticationResponse } from "./is-authentication-response";

describe("isAuthenticationResponse", () => {
  it.each([
    { search: "?code=auth-code&state=msal-state", hash: "" },
    { search: "", hash: "#code=auth-code&state=msal-state" },
    { search: "?error=access_denied&state=msal-state", hash: "" },
  ])("recognizes an OAuth response in $search$hash", (location) => {
    expect(isAuthenticationResponse(location)).toBe(true);
  });

  it.each([
    { search: "", hash: "" },
    { search: "?genre=Rock", hash: "" },
    { search: "?code=ordinary-app-value", hash: "" },
    { search: "?state=ordinary-app-value", hash: "" },
  ])("leaves ordinary application URLs alone", (location) => {
    expect(isAuthenticationResponse(location)).toBe(false);
  });
});
