import { DataStore } from '../../../shared/interfaces/DataStore';
import { LearningObjectSummary, UserToken } from '../../../shared/types';
import { getReleasedLearningObjectSummary } from '../../LearningObjectInteractor';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import {
  requesterIsAdminOrEditor,
  requesterIsAuthor,
} from '../../../shared/AuthorizationManager';
import { LearningObject } from '../../../shared/entity';
import { validateRequest } from './tasks/validateRequest';
import { getLearningObjectRevision } from './getLearningObjectRevision';

const ERROR_MESSAGES = {
  REVISIONS: {
    UNRELEASED_EXISTS: `The author has created a revision for this Learning Object but has not
    yet made a submission to a collection. Please contact the author to coordinate integrating
    your changes with theirs`,
    SUBMISSION_EXISTS: `This Learning Object already has a submission that is currently in the
    review stage. Please make your edits to the submission directly in order to integrate your
    changes with those that already exist.`,
    INVALID_ACCESS: `You do not have permission to create a Revision for this Learning Object.
    Please contact the author or an editor if you would like to propose changes.`,
  },
};

/**
 * createLearningObjectRevision handles requests from Authors, Editors, and Admins
 * to create a new Revision for a Learning Object. Revisions cannot be made if one
 * already exists - only one revision can exist at a time. Revisions created by an
 * Editor or Admin will start in the Proofing stage, bypassing the Author completely.
 *
 * @param params
 */
export async function createLearningObjectRevision(params: {
  username: string;
  learningObjectId: string;
  dataStore: DataStore;
  requester: UserToken;
}): Promise<void> {
  const { dataStore, learningObjectId, requester, username } = params;
  await validateRequest({
    username: username,
    learningObjectId: learningObjectId,
    dataStore: dataStore,
  });

  const releasedCopy = await getReleasedLearningObjectSummary({
    dataStore: dataStore,
    id: learningObjectId,
  });

  if (!releasedCopy) {
    throw new ResourceError(
      `Cannot create a revision of Learning Object: ${learningObjectId} since it is not released.`,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  await determineRevisionType({
    dataStore,
    learningObjectId,
    requester,
    releasedCopy,
  });
}

/**
 * determineRevisionType uses information about the requestor to determine if
 * the revision should be placed in control of the Author or Editorial Team.
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.dataStore the storage gateway for Learning Objects
 * @param params.requester identifiers for the user making the request
 */
async function determineRevisionType(params: {
  releasedCopy: LearningObjectSummary;
  learningObjectId: string;
  dataStore: DataStore;
  requester: UserToken;
}) {
  const { releasedCopy } = params;
  if (
    requesterIsAuthor({
      authorUsername: releasedCopy.author.username,
      requester: params.requester,
    })
  ) {
    await saveRevision({
      dataStore: params.dataStore,
      learningObjectId: params.learningObjectId,
      revisionStatus: LearningObject.Status.UNRELEASED,
      releasedCopy,
    });
  } else if (requesterIsAdminOrEditor(params.requester)) {
    createRevisionInProofing(params);
  } else {
    throw new ResourceError(
      ERROR_MESSAGES.REVISIONS.INVALID_ACCESS,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * saveRevision handles the coordination of changes to the Learning Object's
 * Working Copy.
 *
 * @param params.revisionStatus the status to start the revision at
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.dataStore the storage gateway for Learning Objects
 */
async function saveRevision(params: {
  revisionStatus: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING;
  releasedCopy: LearningObjectSummary;
  learningObjectId: string;
  dataStore: DataStore;
}) {
  params.releasedCopy.revision++;

  await params.dataStore.editLearningObject({
    id: params.learningObjectId,
    updates: {
      revision: params.releasedCopy.revision,
      status: params.revisionStatus,
    },
  });
}

/**
 * createRevisionInProofing creates a revision and fast-forwards the status to Proofing in the case
 * that no revision currently exists. If a revision exists, an error will be thrown to indicate
 * failure of the requested action and any steps the requester can take.
 *
 * @param params.releasedCopy the summary information of the released Learning Object
 * @param params.learningObjectId the unique identifier of the Learning Object being revised
 * @param params.dataStore the storage gateway for Learning Objects
 * @param params.requester identifiers for the user making the request
 */
async function createRevisionInProofing({
  releasedCopy,
  learningObjectId,
  dataStore,
  requester,
}: {
  releasedCopy: LearningObjectSummary;
  learningObjectId: string;
  dataStore: DataStore;
  requester: UserToken;
}) {
  try {
    const revisionSummary = await getLearningObjectRevision({
      dataStore,
      requester,
      learningObjectId,
      revisionId: releasedCopy.revision + 1,
      username: releasedCopy.author.username,
      summary: true,
    });
    if (revisionSummary.status === LearningObject.Status.UNRELEASED) {
      throw new ResourceError(
        ERROR_MESSAGES.REVISIONS.UNRELEASED_EXISTS,
        ResourceErrorReason.FORBIDDEN,
      );
    } else {
      throw new ResourceError(
        ERROR_MESSAGES.REVISIONS.SUBMISSION_EXISTS,
        ResourceErrorReason.FORBIDDEN,
      );
    }
  } catch (e) {
    if (
      e instanceof ResourceError &&
      e.name === ResourceErrorReason.NOT_FOUND
    ) {
      await saveRevision({
        dataStore: dataStore,
        learningObjectId: learningObjectId,
        revisionStatus: LearningObject.Status.PROOFING,
        releasedCopy: releasedCopy,
      });
    } else throw e;
  }
}