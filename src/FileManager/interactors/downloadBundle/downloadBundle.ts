import { UserToken, AccessGroup } from '../../../shared/types';
import { Gateways, Drivers } from '../shared/dependencies';
import { ResourceErrorReason, ResourceError } from '../../../shared/errors';
import {
  requesterIsAdminOrEditor,
  requesterIsAuthor,
  authorizeReadAccess,
} from '../../../shared/AuthorizationManager';
import { LearningObject } from '../../../shared/entity';
import { Stream } from 'stream';
import { bundleLearningObject } from '../../../LearningObjects/Publishing/Bundler/Interactor';
import FileManagerModuleErrorMessages from '../shared/errors';
import { uploadFile } from '../Interactor';
import { updateDownloads } from '../../../shared/MongoDB/HelperFunctions/updateDownloads/updateDownloads';

export type DownloadBundleParams = {
  learningObject: LearningObject;
  requester: UserToken;
};

/**
 * downloadBundle acts as a wrapper function for downloads.
 * If the revision flag is set set, downloadWorkingCopy is invoked.
 * Otherwise, downloadReleasedCopy is called.
 * @param { DownloadBundleParams } params
 */
export async function downloadBundle(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { status } = params.learningObject;

  if (status !== LearningObject.Status.RELEASED) {
    return await downloadWorkingCopy(params);
  }
  return await downloadReleasedCopy(params);
}

/**
 * downloadWorkingCopy gets the requested Learning Object from the
 * database and uses it to authorize the download request.
 * If the requester does not have access, a forbidden error is thrown.
 * Otherwise, the createBundleStream function is invoked.
 * @param { DownloadBundleParams } params
 */
async function downloadWorkingCopy(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { requester, learningObject } = params;
  const hasAccess = authorizeWorkingCopyDownloadRequest(
    requester,
    learningObject,
  );

  if (!hasAccess) {
    throw new ResourceError(
      FileManagerModuleErrorMessages.forbiddenLearningObjectDownload(
        requester.username,
      ),
      ResourceErrorReason.FORBIDDEN,
    );
  }
  return createBundleStream(learningObject, requester);
}

/**
 * downloadReleasedCopy fetches the requested Learning Object.
 * Released Learning Object downloads do not need to be authorized.
 * The Learning Object is used to check if the requested bundle.zip file exists.
 * If the bundle does exists, the file is streamed to the client.
 * Otherwise, the bundle.zip file is created and stored. The generated bundle
 * is then streamed to the client.
 * @param { DownloadBundleParams } params
 */

async function downloadReleasedCopy(
  params: DownloadBundleParams,
): Promise<Stream> {
  const { requester, learningObject } = params;

  const utilityUsers = await Drivers.utility().getUtilityUsers();
  const payload = utilityUsers.map((r: { username: string; }) => r.username);

  if (!(payload.includes(requester.username))) {
    await updateDownloads(requester, learningObject);
  }

  const fileExists = await Drivers.fileManager().hasAccess({
    authorUsername: learningObject.author.username,
    learningObjectCUID: learningObject.cuid,
    version: learningObject.version,
    path: `${learningObject.cuid}.zip`,
  });

  if (!fileExists) {
    const bundle = await createBundleStream(learningObject, requester);
    await uploadFile({
      authorUsername: learningObject.author.username,
      learningObjectCUID: learningObject.cuid,
      version: learningObject.version,
      file: {
        path: `${learningObject.cuid}.zip`,
        data: bundle,
      },
    });
  }

  return await Drivers.fileManager().streamFile({
    authorUsername: learningObject.author.username,
    learningObjectCUID: learningObject.cuid,
    version: learningObject.version,
    path: `${learningObject.cuid}.zip`,
  });
}

/**
 * createBundleStream uses the given requester and Learning Object
 * to build a HierarchicalLearningObject. This object is then used to
 * create a stream.
 * @param { LearningObject } learningObject
 * @param { UserToken } requester
 */
async function createBundleStream(
  learningObject: LearningObject,
  requester: UserToken,
) {
  // Attach file metadata to Learning Object before creating bundle
  let files: LearningObject.Material.File[] = [];
  authorizeReadAccess({ requester, learningObject });
  files = await Gateways.fileMetadataGateway().getAllFileMetadata({
    requester,
    learningObjectId: learningObject.id,
  });
  learningObject.materials.files = files;

  const hierarchy = await Gateways.hierarchyGateway().buildHierarchicalLearningObject(
    learningObject,
    requester,
  );
  // FIXME: Change use of bundler - can be a shared driver
  return bundleLearningObject({ learningObject: hierarchy });
}

/**
 * authorizeWorkingCopyDownloadRequest returns true is the requester
 * is an admin, editor, curator, reviewer, or Learning Object author.
 * Curators and reviewers must be
 * members of the correct collection.
 * @param { LearningObject } learningObject
 * @param { UserToken } requester
 */
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

/**
 * hasCollectionAccess checks to see if curators
 * and reviewers are members of the correct collection
 * @param { LearningObject } learningObject
 * @param { UserToken } requester
 */
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


