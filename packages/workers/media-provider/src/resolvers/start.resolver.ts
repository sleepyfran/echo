import { forkSync, type ForkSyncMediaProviderInput } from "../sync/sync";

type StartMediaProviderResolverInput = Omit<
  ForkSyncMediaProviderInput,
  "force"
>;

export const startMediaProviderResolver = (
  input: StartMediaProviderResolverInput,
) => forkSync({ ...input, force: false });
