import { UserToken, LearningObjectState } from '../../shared/types';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import {
  requesterIsAdminOrEditor,
  requesterIsAuthor,
} from '../../shared/AuthorizationManager';
import { LearningObject } from '../../shared/entity';
import { RevisionsDataStore } from '../RevisionsDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { FileManagerModule } from '../../FileManager/FileManagerModule';

export const ERROR_MESSAGES = {
  REVISIONS: {
    UNRELEASED_EXISTS: `The author has created a revision for this Learning Object but has not
    yet made a submission to a collection. Please contact the author to coordinate integrating
    your changes with theirs.`,
    SUBMISSION_EXISTS: `This Learning Object already has a submission that is currently in the
    review stage. Please make your edits to the submission directly in order to integrate your
    changes with those that already exist.`,
    INVALID_ACCESS: `You do not have permission to create a Revision for this Learning Object.
    Please contact the author or an editor if you would like to propose changes.`,
    EXISTS: `This Learning Object already has a revision. Please complete or delete the current
    revision before attempting to create a new one.`,
    LEARNING_OBJECT_DOES_NOT_EXIST: (cuid: string): string => `Cannot create a revision of a Learning Object with cuid '${cuid}' because the Learning Object does not exist.`,
    INCORRECT_AUTHOR: (cuid: string, username: string): string => `Learning Object: ${cuid} does not belong to ${username}`,
    LEARNING_OBJECT_NOT_RELEASED: (cuid: string): string => `Cannot create a revision of Learning Object: ${cuid} since it is not released.`,
  },
};

/**
 * createLearningObjectRevision handles requests from Authors, Editors, and Admins
 * to create a new Revision for a Learning Object. Revisions cannot be made if one
 * already exists - only one revision can exist at a time. Revisions created by an
 * Editor or Admin will start in the Proofing stage, bypassing the Author completely.
 *
 * @param params
 *
 * @returns {Promise<number>} id of the newly created Learning Object revision
 */
export async function createLearningObjectRevision(params: {
  username: string;
  cuid: string;
  dataStore: RevisionsDataStore;
  requester: UserToken;
}): Promise<number> {
  const { dataStore, cuid, requester, username } = params;

  let learningObjectsForCUID = await LearningObjectAdapter.getInstance().getInternalLearningObjectByCuid({cuid, username, userToken: requester});

  if (!learningObjectsForCUID || !learningObjectsForCUID.length) {
    throw new ResourceError(ERROR_MESSAGES.REVISIONS.LEARNING_OBJECT_DOES_NOT_EXIST(params.cuid), ResourceErrorReason.NOT_FOUND);
  }

  if (learningObjectsForCUID.length > 1) {
    const errorMessage = determineRevisionExistsErrorMessage(learningObjectsForCUID);
    throw new ResourceError(errorMessage, ResourceErrorReason.BAD_REQUEST);
  }

  const learningObject = learningObjectsForCUID[0];

  if (learningObject.author.username !== params.username) {
    throw new ResourceError(
      ERROR_MESSAGES.REVISIONS.INCORRECT_AUTHOR(learningObject.cuid, params.username),
      ResourceErrorReason.BAD_REQUEST,
    );
  }

  const version = generateNewRevisionID(learningObject);

  await determineRevisionType({
    dataStore,
    version,
    learningObjectId: learningObject.id,
    requester,
    releasedCopy: learningObject,
  });

  return version;
}

/**
 * determineRevisionType uses information about the requestor to determine if
 * the revision should be placed in control of the Author or Editorial Team.
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.version new version to be created
 * @param params.dataStore the storage gateway for Learning Objects
 * @param params.requester identifiers for the user making the request
 */
async function determineRevisionType(params: {
  releasedCopy: LearningObject;
  version: number;
  learningObjectId: string;
  dataStore: RevisionsDataStore;
  requester: UserToken;
}) {
  const { releasedCopy } = params;
  if (
    requesterIsAuthor({
      authorUsername: releasedCopy.author.username,
      requester: params.requester,
    })
  ) {
    await createRevision(params);
  } else if (requesterIsAdminOrEditor(params.requester)) {
    await createRevisionInProofing(params);
  } else {
    throw new ResourceError(
      ERROR_MESSAGES.REVISIONS.INVALID_ACCESS,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}


/**
 * createRevision creates a new revision for the Author in the case that no revision currently
 * exists. If a revision exists, an error will be thrown to indicate failure of the requested
 * action and any steps the requester can take.
 *
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.version new version to be created
 * @param params.dataStore the storage gateway for Learning Objects
 * @par new ream params.dataStore the storage gateway for Learning Objects
 * @param params.requester identifiers for the user making the request
 */
async function createRevision({
  releasedCopy,
  learningObjectId,
  version,
  dataStore,
  requester,
}: {
  releasedCopy: LearningObject;
  learningObjectId: string;
  version: number;
  dataStore: RevisionsDataStore;
  requester: UserToken;
}) {
  await FileManagerModule.duplicateRevisionFiles({
    authorUsername: releasedCopy.author.username,
    learningObjectCUID: releasedCopy.cuid,
    currentLearningObjectVersion: releasedCopy.version,
    newLearningObjectVersion: version,
  });
  await dataStore.createRevision(releasedCopy.cuid, version);
  return version;
}

/**
 * createRevisionInProofing creates a revision and fast-forwards the status to Proofing in the case
 * that no revision currently exists. If a revision exists, an error will be thrown to indicate
 * failure of the requested action and any steps the requester can take.
 *
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.version new version to be created
 * @param params.dataStore the storage gateway for Learning Objects
 * @param params.requester identifiers for the user making the request
 */
async function createRevisionInProofing({
  releasedCopy,
  learningObjectId,
  version,
  dataStore,
  requester,
}: {
  releasedCopy: LearningObject;
  learningObjectId: string;
  version: number;
  dataStore: RevisionsDataStore;
  requester: UserToken;
}) {
  await FileManagerModule.duplicateRevisionFiles({
    authorUsername: releasedCopy.author.username,
    learningObjectCUID: releasedCopy.cuid,
    currentLearningObjectVersion: releasedCopy.version,
    newLearningObjectVersion: version,
  });
  await dataStore.createRevision(releasedCopy.cuid, version, LearningObject.Status.PROOFING);
  return version;
}

function generateNewRevisionID(learningObject: LearningObject) {
  return learningObject.version + 1;
}

function determineRevisionExistsErrorMessage(learningObjectsForCUID: LearningObject[]): string {
  // retrieve the Learning Object that is NOT yet released
  const notYetReleased: LearningObject = learningObjectsForCUID.filter(object => object.status !== LearningObject.Status.RELEASED)[0];

  const hasUnreleased: boolean = notYetReleased.status === LearningObject.Status.UNRELEASED;
  const hasSubmission: boolean = LearningObjectState.IN_REVIEW.includes(notYetReleased.status as LearningObject.Status);

  let error: string;

  if (hasUnreleased) {
    error = ERROR_MESSAGES.REVISIONS.UNRELEASED_EXISTS;
  } else if (hasSubmission) {
    error = ERROR_MESSAGES.REVISIONS.SUBMISSION_EXISTS;
  } else {
    error = ERROR_MESSAGES.REVISIONS.EXISTS;
  }

  return error;
}
