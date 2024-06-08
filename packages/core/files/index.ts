import type { FileMetadata } from "@echo/core-types";

/**
 * Defines a regex that matches supported audio file extensions.
 */
const supportedAudioExtensionsRegex = /.(wav|mp3|aac|ogg|flac|m4a|opus)$/i;

/**
 * Checks the file extension of the given file to determine if it is a supported
 * audio file or not. This will not actually check the file contents, only the
 * file name, therefore it is possible that files with invalid content but a
 * valid extension might be wrongly reported as supported, and similarly files
 * with valid content but an invalid extension might be wrongly reported as
 * unsupported.
 */
export const isSupportedAudioFile = (file: FileMetadata) =>
  supportedAudioExtensionsRegex.test(file.name);
