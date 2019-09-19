import {
    Requester,
    FileMetadataFilter,
    LearningObjectFile,
    LearningObjectSummary,
} from '../../typings';
import {
    MICROSOFT_EXTENSIONS,
    CAN_PREVIEW,
    FILE_API_URI,
    MICROSOFT_PREVIEW_URL,
} from '../shared/constants';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import { authorizeReadAccess } from '../../../shared/AuthorizationManager';
import * as Validators from '../shared/validators';
import { Gateways } from '../shared/resolvedDependencies';
import { ResourceErrorReason, ResourceError } from '../../../shared/errors';
import { getFilePreviewURL } from '../shared/getFilePreviewURL/getFilePreviewURL';
import { LearningObject } from '../../../shared/entity';

/**
 * Retrieves all file metadata that belongs to a Learning Object
 *
 * Allows file metadata to be filtered by released and unreleased
 *
 * If not filter specified attempts to retrieve released and unreleased file metadata; If not authorized to read unreleased only released is returned
 * If released is specified will only return released
 * If unreleased is specified will only return unreleased if authorized. If not authorized, an Invalid Access ResourceError is thrown
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {number} learningObjectRevision [The revision number of the Learning Object]
 * @returns {Promise<LearningObjectFile[]>}
 */
export async function getAllFileMetadata({
    requester,
    learningObjectId,
  }: {
    requester: Requester;
    learningObjectId: string;
  }): Promise<LearningObjectFile[]> {
    try {
      validateRequestParams({
        operation: 'Get all file metadata',
        values: [
          {
            value: learningObjectId,
            validator: Validators.stringHasContent,
            propertyName: 'Learning Object id',
          },
        ],
      });
      const learningObject = await Gateways.learningObjectGateway().getActiveLearningObjectSummary(
        {
          requester,
          id: learningObjectId,
        },
      );
  
      authorizeReadAccess({ learningObject, requester });
      // if (!filter || filter === 'released') {
      //   const releasedObject: LearningObjectSummary = await Gateways.learningObjectGateway().getReleasedLearningObjectSummary(
      //     learningObjectId,
      //   );
      //   releasedFiles$ = Gateways.learningObjectGateway()
      //     .getReleasedFiles(learningObjectId)
      //     .then(files => files.map(appendFilePreviewUrls(releasedObject)));
      //   if (filter === 'released') return releasedFiles$;
      // }
      // const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      //   { requester, id: learningObjectId },
      // );
  
      // try {
      //   authorizeReadAccess({ learningObject, requester });
      // } catch (e) {
      //   if (filter === 'unreleased') throw e;
      //   return releasedFiles$;
      // }
  
      // const workingFiles$ = Drivers.datastore()
      //   .fetchAllFileMeta(learningObjectId)
      //   .then(files =>
      //     files.map(file =>
      //       transformFileMetaToLearningObjectFile({
      //         authorUsername: learningObject.author.username,
      //         learningObjectId: learningObject.id,
      //         file,
      //       }),
      //     ),
      //   );
  
      // if (filter === 'unreleased') return workingFiles$;
  
      // return Promise.all([
      //   releasedFiles$.catch(handleReleasedFilesNotFound),
      //   workingFiles$,
      // ]).then(([releasedFiles, workingFiles]) => [
      //   ...releasedFiles,
      //   ...workingFiles,
      // ]);
    } catch (e) {
      handleError(e);
    }
  }

/**
 * Appends file preview urls to files
 *
 * @param {LearningObjectSummary} learningObject
 * @returns {(
 *   value: LearningObjectFile,
 *   index: number,
 *   array: LearningObjectFile[],
 * ) => LearningObjectFile}
 */
function appendFilePreviewUrls(
  learningObject: LearningObjectSummary,
): (
  value: LearningObjectFile,
  index: number,
  array: LearningObjectFile[],
) => LearningObjectFile {
  return file => {
    file.previewUrl = getFilePreviewURL({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.id,
      unreleased: learningObject.status !== LearningObject.Status.RELEASED,
      fileId: file.id,
      extension: file.extension,
    });
    return file;
  };
}

/**
 * Handles NotFound ResourceError when requesting released files by returning an empty array
 *
 * This is in place to avoid service failures in the case where a Learning Object has not yet been released,
 * so it will not have any released files.
 *
 * This should only be used in the case where released files are not explicitly requested.
 *
 * @param {Error} e
 * @returns {(any[] | never)}
 */
function handleReleasedFilesNotFound(e: Error): any[] | never {
    if (e instanceof ResourceError && e.name === ResourceErrorReason.NOT_FOUND) {
      return [];
    }
    throw e;
}
