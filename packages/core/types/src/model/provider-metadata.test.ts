import { Option } from "effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { StartProvider } from "./broadcast-requests";
import { FolderId } from "./file-system";
import {
  FileBasedProviderId,
  OneDriveProviderMetadata,
  ProviderStartArgs,
  ProviderType,
  type FileBasedStartArgs,
} from "./provider-metadata";

describe("ProviderStartArgs", () => {
  it("survives JSON and structured-clone transport", () => {
    const expiresOn = new Date("2026-09-07T20:00:00.000Z");
    const startArgs: FileBasedStartArgs = {
      _tag: ProviderType.FileBased,
      authInfo: {
        accessToken: "access-token",
        expiresOn,
        providerSpecific: {
          _tag: "MSAL",
          account: {
            environment: "login.example.com",
            homeAccountId: "home-account-id",
            localAccountId: "local-account-id",
            tenantId: "tenant-id",
            username: "user@example.com",
          },
        },
      },
      lastSyncedAt: Option.none(),
      metadata: OneDriveProviderMetadata,
      rootFolder: {
        _tag: "folder",
        id: FolderId("root"),
        name: "Root",
      },
    };

    const encoded = S.encodeSync(ProviderStartArgs)(startArgs);
    const fromJson = JSON.parse(JSON.stringify(encoded));
    const fromStructuredClone = structuredClone(encoded);

    expect(fromJson.lastSyncedAt).toBeNull();
    expect(fromJson.authInfo.expiresOn).toBe(expiresOn.toISOString());
    expect(S.decodeUnknownSync(ProviderStartArgs)(fromJson)).toEqual(startArgs);
    expect(S.decodeUnknownSync(ProviderStartArgs)(fromStructuredClone)).toEqual(
      startArgs,
    );

    const request = new StartProvider({ args: startArgs });
    const transportedRequest = structuredClone(
      S.encodeSync(StartProvider)(request),
    );

    expect(S.decodeUnknownSync(StartProvider)(transportedRequest)).toEqual(
      request,
    );
    expect(startArgs.metadata.id).toBe(FileBasedProviderId.OneDrive);
  });
});
