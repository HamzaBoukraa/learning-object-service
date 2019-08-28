import { UserToken } from '../../shared/types';
import { Gateways } from './shared/dependencies';
import { ResourceErrorReason } from '../../shared/errors';

type DownloadBundleParams = {
  requester: UserToken,
  learningObjectAuthorUsername: string,
  learningObjectId: string,
  revision: boolean,
};
/**
 *
 */
export function downloadBundle(params: DownloadBundleParams) {
  const { revision } = params;
  // is it a revision or not
  if (revision) {
    downloadWorkingCopy(params);
  } else {
    downloadReleasedCopy(params);
  }
}

function downloadWorkingCopy(params: DownloadBundleParams) {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = getLearningObject(params, true);
}

function downloadReleasedCopy(params: DownloadBundleParams) {
  const { requester, learningObjectAuthorUsername, learningObjectId } = params;
  const learningObject = getLearningObject(params);
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
