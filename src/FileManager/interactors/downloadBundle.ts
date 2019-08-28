import { UserToken, AccessGroup } from '../../shared/types';
import { Gateways } from './shared/dependencies';
import { ResourceErrorReason, ResourceError } from '../../shared/errors';
import { hasLearningObjectWriteAccess, requesterIsAdminOrEditor, requesterIsAuthor } from '../../shared/AuthorizationManager';
import { LearningObject } from '../../shared/entity';
import { bool } from 'aws-sdk/clients/signer';

type DownloadBundleParams = {
  requester: UserToken,
  learningObjectAuthorUsername: string,
  learningObjectId: string,
  revision: boolean,
};

export async function downloadBundle(params: DownloadBundleParams) {
  const { revision } = params;
  // is it a revision or not
  if (revision) {
    await downloadWorkingCopy(params);
  } else {
    await downloadReleasedCopy(params);
  }
}

async function downloadWorkingCopy(params: DownloadBundleParams) {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params, true);
  const hasAccess = authorizeDownloadRequest(requester, learningObject);
  if (!hasAccess) {
    throw new ResourceError(
      `User ${requester.username} does not have access to download the requested Learning Object`,
      ResourceErrorReason.FORBIDDEN,
    );
  }
}

function authorizeDownloadRequest(requester: UserToken, learningObject: LearningObject): boolean {
  return requesterIsAdminOrEditor(requester)
    || hasCollectionAccess(requester, learningObject)
    || requesterIsAuthor({ authorUsername: learningObject.author.username, requester });
}

function hasCollectionAccess(requester: UserToken, learningObject: LearningObject): boolean {
  return (
    requester.accessGroups.indexOf(
      `${AccessGroup.REVIEWER}@${learningObject.collection}`,
    ) > -1 ||
    requester.accessGroups.indexOf(
      `${AccessGroup.CURATOR}@${learningObject.collection}`,
    ) > -1
  );
}

async function downloadReleasedCopy(params: DownloadBundleParams) {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params);
}

async function getLearningObject(params: DownloadBundleParams, workingCopy = false) {
  const learningObjectGateway = Gateways.learningObjectGateway();
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  try {
    return await Gateways.learningObjectGateway().getLearningObjectById({ learningObjectId, requester });
  } catch (e) {
    if (e.name === ResourceErrorReason.NOT_FOUND) {
      return await learningObjectGateway.getLearningObjectByName({
        username: learningObjectAuthorUsername,
        learningObjectName: learningObjectId,
        requester,
        revision: workingCopy,
      });
    } else throw e;
  }
}
