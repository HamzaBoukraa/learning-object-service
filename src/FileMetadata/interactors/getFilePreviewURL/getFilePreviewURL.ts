import {
    CAN_PREVIEW,
    MICROSOFT_EXTENSIONS,
    FILE_API_URI,
    MICROSOFT_PREVIEW_URL,
} from '../shared/constants';

/**
 * Returns preview url for file based on extension
 * If the file's extension matches a Microsoft file extension, the Microsoft preview url for the file is returned
 * If the file's extension can be opened in browser, the file's url is returned
 * If the extension does not match any case, an empty string is returned.
 *
 * @export
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @param {string} fileId [The id of the file metadata]
 * @param {string} extension [The file type of the file including the '.' (ie. '.pdf')]
 *
 * @returns {string} [Preview url]
 */
export function getFilePreviewURL({
    authorUsername,
    learningObjectId,
    fileId,
    extension,
    unreleased,
  }: {
    authorUsername: string;
    learningObjectId: string;
    fileId: string;
    extension: string;
    unreleased?: boolean;
  }): string {
    const extensionType = extension
      ? extension
          .trim()
          .toLowerCase()
          .replace('.', '')
      : null;
    if (CAN_PREVIEW.includes(extensionType)) {
      if (MICROSOFT_EXTENSIONS.includes(extensionType)) {
        return generatePreviewUrl({
          authorUsername,
          learningObjectId,
          fileId,
          unreleased,
          microsoftPreview: true,
        });
      }
      return generatePreviewUrl({
        authorUsername,
        learningObjectId,
        fileId,
        unreleased,
      });
    }
    return null;
}

/**
 * Generates preview url for a file.
 *
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @param {string} fileId [The id of the file metadata]
 * @param {boolean} microsoftPreview [Whether or not the file can be previewed using Microsoft's file previewer]
 * @returns {string}
 */
function generatePreviewUrl({
    learningObjectId,
    authorUsername,
    fileId,
    unreleased,
    microsoftPreview,
  }: {
    learningObjectId: string;
    authorUsername: string;
    fileId: string;
    unreleased?: boolean;
    microsoftPreview?: boolean;
  }): string {
    let fileSource =
      `${FILE_API_URI}/users/${authorUsername}/learning-objects/${learningObjectId}/materials/files/${fileId}/download` +
      `?status=${unreleased ? 'unreleased' : 'released'}`;
    if (microsoftPreview) {
      return `${MICROSOFT_PREVIEW_URL}?src=${fileSource}`;
    }
    return fileSource + '&open=true';
}
