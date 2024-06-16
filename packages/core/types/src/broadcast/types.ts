/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Defines all available channels.
 */
export type ChannelName = "mediaProvider";

/**
 * Defines the base schema that all broadcast channel schemas should follow.
 */
export type Schema = {
  actions: Record<string, any>;
  resolvers: Record<string, any>;
};
