import {
  LearningObjectChildSummary,
  UserToken,
  LearningObjectState,
} from '../../../shared/types';
import { mapChildLearningObjectToSummary } from '../../../shared/functions';
import { requesterIsAuthor } from '../../../shared/AuthorizationManager';
import * as mongoHelperFunctions from '../../../shared/MongoDB/HelperFunctions';

/**
 * @private
 *
 * Loads the summaries for a Learning Object's first level of children
 *
 * If released children are requested, only released children are returned
 * Otherwise children are returned based on authorization level:
 * Author: all children statuses
 * Admin/Editor/Curator/Reviewer: released + in review
 *
 * If requester is not author or privileged the `released` param should be true
 *
 * @returns {Promise<LearningObjectChildSummary[]>}
 */
export async function loadChildrenSummaries({
  learningObjectId,
  authorUsername,
  released,
  requester,
}: {
  learningObjectId: string;
  authorUsername: string;
  released: boolean;
  requester: UserToken;
}): Promise<LearningObjectChildSummary[]> {
  let children: LearningObjectChildSummary[];
  if (released) {
    children = (await mongoHelperFunctions.loadReleasedChildObjects({
      id: learningObjectId,
      full: false,
    })).map(mapChildLearningObjectToSummary);
  } else {
    const childrenStatus = requesterIsAuthor({
      requester,
      authorUsername: authorUsername,
    })
      ? LearningObjectState.ALL
      : [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];
    children = (await mongoHelperFunctions.loadChildObjects({
      id: learningObjectId,
      full: false,
      status: childrenStatus,
    })).map(mapChildLearningObjectToSummary);
  }
  return children;
}
