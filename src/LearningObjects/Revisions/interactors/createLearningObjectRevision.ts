import { DataStore } from '../../../shared/interfaces/DataStore';
import { UserToken } from '../../../shared/types';
import { getReleasedLearningObjectSummary } from '../../LearningObjectInteractor';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { requesterIsAuthor } from '../../../shared/AuthorizationManager';
import { LearningObject } from '../../../shared/entity';
import { validateRequest } from './tasks/validateRequest';

/**
 * createLearningObjectRevision is responsible
 * for orchestrating the creation of a Learning
 * Object revision. The function starts by validating
 * the request structure. This is done by calling the
 * validateRequest function, which ensures that
 * the given userId and learningObjectId pair produce
 * a Learning Object. After the request is validated,
 * the function retrieves the Released Copy of the
 * Learning Object. If the Released Copy of the
 * Learning Object is not found, the function throws a
 * Resource Error. The Released Copy is used to validate
 * that the requester is the Learning Object author. It is
 * also used to increment the revision property of the
 * Working Copy. The function ends by updating the Working
 * Copy to have a revision that is one greater than the Released Copy
 * revision and a status of unreleased.
 * @param params
 */
export async function createLearningObjectRevision(params: {
  username: string,
  learningObjectId: string,
  dataStore: DataStore,
  requester: UserToken,
}): Promise<void> {
  await validateRequest({
    username: params.username,
    learningObjectId: params.learningObjectId,
    dataStore: params.dataStore,
  });

  const releasedCopy = await getReleasedLearningObjectSummary({
    dataStore: params.dataStore,
    id: params.learningObjectId,
  });

  if (!releasedCopy) {
    throw new ResourceError(
      `Cannot create a revision of Learning Object: ${params.learningObjectId} since it is not released.`,
      ResourceErrorReason.BAD_REQUEST,
    );
  }

  if (
    !requesterIsAuthor({
      authorUsername: releasedCopy.author.username,
      requester: params.requester,
    })
  ) {
    throw new ResourceError(
      `Cannot create a revision. Requester ${params.requester.username} must be the author of Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  releasedCopy.revision++;

  await params.dataStore.editLearningObject({
    id: params.learningObjectId,
    updates: {
      revision: releasedCopy.revision,
      status: LearningObject.Status.UNRELEASED,
    },
  });
}
