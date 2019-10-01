import { DataStore } from '../../../shared/interfaces/DataStore';
import {
  LearningObjectState,
  LearningObjectSummary,
  UserToken,
} from '../../../shared/types';
import { LearningObject, User } from '../../../shared/entity';
import {
  handleError,
  ResourceError,
  ResourceErrorReason,
} from '../../../shared/errors';
import { validateRequest } from './tasks/validateRequest';
import {
  authorizeRequest,
  hasReadAccessByCollection,
  requesterIsAdminOrEditor,
  requesterIsAuthor,
} from '../../../shared/AuthorizationManager';
import { LearningObjectsModule } from '../../LearningObjectsModule';
import { UserGateway } from '../../interfaces/UserGateway';

namespace Gateways {
  export const user = () =>
    LearningObjectsModule.resolveDependency(UserGateway);
}

/**
 * Retrieves Learning Object revision by id and revision number
 *
 * The working copy can only be returned if
 * The requester is the author
 * The requester is a reviewer/curator@<Learning Object's collection> && the Learning Object is not unreleased
 * The requester is an admin/editor && the Learning Object is not unreleased
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} learningObjectId [Id of the Learning Object]
 * @param {number} version [Version number of the Learning Object]
 * @param {string} username [Username of the Learning Object author]
 * @param {boolean} summary [Boolean indicating whether or not to return a LearningObject or LearningObjectSummary]
 * @returns {Promise<LearningObject | LearningObjectSummary>}
 */
export async function getLearningObjectRevision({
  dataStore,
  requester,
  learningObjectId,
  version,
  username,
  summary,
}: {
  dataStore: DataStore;
  requester: UserToken;
  learningObjectId: string;
  version: number;
  username: string;
  summary?: boolean;
}): Promise<LearningObject | LearningObjectSummary> {
  try {
    if (version === 0) {
      throw new ResourceError(
        `Cannot find revision ${version} for Learning Object ${learningObjectId}`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    await validateRequest({
      username: username,
      learningObjectId: learningObjectId,
      dataStore: dataStore,
    });

    let learningObject: LearningObject | LearningObjectSummary;
    let author: User;

    if (!summary) {
      author = await Gateways.user().getUser(username);
    }
    learningObject = await dataStore.fetchLearningObjectRevision({
      id: learningObjectId,
      version: version,
      author,
    });
    if (!learningObject) {
      throw new ResourceError(
        `Cannot find revision ${version} of Learning Object ${learningObjectId}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    const releasedAccess =
      learningObject.status === LearningObject.Status.RELEASED;
    const authorAccess = requesterIsAuthor({
      requester,
      authorUsername: learningObject.author.username,
    });
    const isUnreleased = LearningObjectState.UNRELEASED.includes(
      learningObject.status as LearningObject.Status,
    );
    const reviewerCuratorAccess =
      !isUnreleased &&
      hasReadAccessByCollection({
        requester,
        collection: learningObject.collection,
      });
    const adminEditorAccess =
      !isUnreleased && requesterIsAdminOrEditor(requester);
    authorizeRequest([
      releasedAccess,
      authorAccess,
      reviewerCuratorAccess,
      adminEditorAccess,
    ]);
    return learningObject;
  } catch (e) {
    handleError(e);
  }
}
