import { UserToken, AccessGroup } from '../../shared/types';
import { Gateways, Drivers } from './shared/dependencies';
import { ResourceErrorReason, ResourceError } from '../../shared/errors';
import {
  requesterIsAdminOrEditor,
  requesterIsAuthor,
} from '../../shared/AuthorizationManager';
import { LearningObject } from '../../shared/entity';
import { Stream } from 'stream';
import { bundleLearningObject } from '../../LearningObjects/Publishing/Bundler/Interactor';
import FileManagerModuleErrorMessages from './shared/errors';
import { uploadFile } from './Interactor';

export type DownloadBundleParams = {
  requester: UserToken;
  learningObjectAuthorUsername: string;
  learningObjectId: string;
  revision: boolean;
};

export async function downloadBundle(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { revision } = params;
  // is it a revision or not
  if (revision) {
    return await downloadWorkingCopy(params);
  } else {
    return await downloadReleasedCopy(params);
  }
}

async function downloadWorkingCopy(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params, true);
  const hasAccess = authorizeWorkingCopyDownloadRequest(
    requester,
    learningObject,
  );
  if (!hasAccess) {
    throw new ResourceError(
      FileManagerModuleErrorMessages.forbiddenLearningObjectDownload(requester.username),
      ResourceErrorReason.FORBIDDEN,
    );
  }
  return createBundleStream(learningObject, requester);
}

async function downloadReleasedCopy(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = await getLearningObject(params);

  const fileExists = await Drivers.fileManager().hasAccess({
    authorUsername: learningObjectAuthorUsername,
    learningObjectId: learningObject.id,
    learningObjectRevisionId: learningObject.revision,
    path: 'bundle.zip',
  });
  if (fileExists) {
    return await Drivers.fileManager().streamFile({
      authorUsername: learningObjectAuthorUsername,
      learningObjectId: learningObject.id,
      learningObjectRevisionId: learningObject.revision,
      path: 'bundle.zip',
    });
  } else {
    // if bundle does not exist, create bundle
    const bundle = await createBundleStream(learningObject, requester);
    await uploadFile({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.id,
      learningObjectRevisionId: learningObject.revision,
      file: {
        path: 'bundle.zip',
        data: bundle,
      },
    });
    // FIXME: catch error thrown and check for NotFound error
    return bundle;
  }
}

async function createBundleStream(
  learningObject: LearningObject,
  requester: UserToken,
) {
  const hierarchy = await Gateways.hierarchyGateway().buildHierarchicalLearningObject(
    learningObject,
    requester,
  );
  // FIXME: Change use of bundler - can be a shared driver
  return bundleLearningObject({ learningObject: hierarchy });
}

function authorizeWorkingCopyDownloadRequest(
  requester: UserToken,
  learningObject: LearningObject,
): boolean {
  return (
    requesterIsAdminOrEditor(requester) ||
    hasCollectionAccess(requester, learningObject) ||
    requesterIsAuthor({
      authorUsername: learningObject.author.username,
      requester,
    })
  );
}

function hasCollectionAccess(
  requester: UserToken,
  learningObject: LearningObject,
): boolean {
  return (
    requester.accessGroups.indexOf(
      `${AccessGroup.REVIEWER}@${learningObject.collection}`,
    ) > -1 ||
    requester.accessGroups.indexOf(
      `${AccessGroup.CURATOR}@${learningObject.collection}`,
    ) > -1
  );
}

async function getLearningObject(
  params: DownloadBundleParams,
  workingCopy = false,
) {
  const learningObjectGateway = Gateways.learningObjectGateway();
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  try {
    return await Gateways.learningObjectGateway().getLearningObjectById({
      learningObjectId,
      requester,
    });
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
