import { InitMessage } from "./src/init";
import MediaProviderWorker from "./src/media-provider.worker?worker";

/**
 * Initializes the media provider worker with the given app config.
 */
export const initializeMediaProviderWorker = () => {
  const worker = new MediaProviderWorker();

  worker.postMessage(InitMessage.make({}));
};
