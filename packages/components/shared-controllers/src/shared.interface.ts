/**
 * Defines a renderer that can render each different status of an effect.
 */
export type StatusListener<A, E> = {
  /**
   * Called when the effect has finished yet.
   */
  initial?: () => unknown;

  /**
   * Called when the effect is yet to finish.
   */
  pending?: () => unknown;

  /**
   * Called when the effect finishes.
   */
  complete?: (result: A) => unknown;

  /**
   * Called when the effect errors.
   */
  error?: (error: E) => unknown;
};
