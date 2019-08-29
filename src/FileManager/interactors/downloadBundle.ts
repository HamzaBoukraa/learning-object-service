import { UserToken, AccessGroup } from '../../shared/types';
import { Gateways } from './shared/dependencies';
import { ResourceErrorReason, ResourceError } from '../../shared/errors';
import { requesterIsAdminOrEditor, requesterIsAuthor } from '../../shared/AuthorizationManager';
import { LearningObject, HierarchicalLearningObject } from '../../shared/entity';
import { Writable, Stream } from 'stream';
import { bundleLearningObject } from '../../LearningObjects/Publishing/Bundler/Interactor';

export type DownloadBundleParams = {
  requester: UserToken,
  learningObjectAuthorUsername: string,
  learningObjectId: string,
  revision: boolean,
};

export async function downloadBundle(params: DownloadBundleParams): Promise<Stream> {
  const { revision } = params;
  // is it a revision or not
  if (revision) {
    return await downloadWorkingCopy(params);
  } else {
    return await downloadReleasedCopy(params);
  }
}

async function downloadWorkingCopy(params: DownloadBundleParams): Promise<Stream> {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params, true);
  const hasAccess = authorizeWorkingCopyDownloadRequest(requester, learningObject);
  if (!hasAccess) {
    throw new ResourceError(
      `User ${requester.username} does not have access to download the requested Learning Object`,
      ResourceErrorReason.FORBIDDEN,
    );
  }
  const hierarchy = await Gateways.hierarchyGateway().buildHierarchicalLearningObject(learningObject, requester);
  // FIXME: Change use of bundler - can be a shared driver
  return bundleLearningObject({ learningObject: hierarchy }); // TODO: Mock in tests via doMock
}

async function downloadReleasedCopy(params: DownloadBundleParams): Promise<Stream> {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params);
  return new Stream();
}

function authorizeWorkingCopyDownloadRequest(requester: UserToken, learningObject: LearningObject): boolean {
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

function constructDownloadBundle(writeStream: Writable, learningObject: LearningObject) {

  /* const objectData = await aggregateLearningObjectDownloadData({ learningObject, requester });

  Drivers.bundler().bundleData({
    writeStream,
    bundleData: objectData,
    extension
  }); */
}
