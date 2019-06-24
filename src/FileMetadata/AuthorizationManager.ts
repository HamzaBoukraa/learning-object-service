/**
 * Set of reusable functions used to authorize requests within this module
 */

import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { Requester, LearningObjectStatus } from './typings';
import { AccessGroup, LearningObjectSummary } from '../shared/types';

const LearningObjectState = {
  UNRELEASED: [LearningObjectStatus.REJECTED, LearningObjectStatus.UNRELEASED],
  IN_REVIEW: [
    LearningObjectStatus.WAITING,
    LearningObjectStatus.REVIEW,
    LearningObjectStatus.PROOFING,
  ],
};

/**
 * Checks if the requester is the author by comparing `authorUsername` against requester's username
 *
 * @export
 * @param {string} authorUsername [Username of the author]
 * @param {Requester} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAuthor({
  authorUsername,
  requester,
}: {
  authorUsername: string;
  requester: Requester;
}): boolean {
  return requester != null && requester.username === authorUsername;
}

/**
 * Checks if requester is an Admin by checking if their `accessGroups` contain the admin privilege
 *
 * @export
 * @param {Requester} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAdmin(requester: Requester): boolean {
  return (
    requester != null &&
    Array.isArray(requester.accessGroups) &&
    requester.accessGroups.includes(AccessGroup.ADMIN)
  );
}

/**
 * Checks if requester is an Editor by checking if their `accessGroups` contain the editor privilege
 *
 * @export
 * @param {Requester} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsEditor(requester: Requester): boolean {
  return (
    requester != null &&
    Array.isArray(requester.accessGroups) &&
    requester.accessGroups.includes(AccessGroup.EDITOR)
  );
}

/**
 * Checks if requester is an Admin or Editor by checking if their `accessGroups` contain the admin or editor privileges
 *
 * @export
 * @param {Requester} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAdminOrEditor(requester: Requester): boolean {
  return requesterIsAdmin(requester) || requesterIsEditor(requester);
}

/**
 * Checks if requester has read access by checking if their `accessGroups` contain the admin, editor, curator@collection, reviewer@collection privileges
 *
 * @export
 * @param {Requester} requester [Token data of the requester]
 * @param {string} collection [Collection value the requester's `accessGroups` must contain]
 * @returns {boolean}
 */
export function hasReadAccessByCollection({
  requester,
  collection,
}: {
  requester: Requester;
  collection: string;
}): boolean {
  if (requesterIsAdminOrEditor(requester)) {
    return true;
  }
  if (requester && Array.isArray(requester.accessGroups)) {
    return (
      requester.accessGroups.includes(`curator@${collection}`) ||
      requester.accessGroups.includes(`reviewer@${collection}`)
    );
  }
  return false;
}

/**
 * Checks if request should be authorized by checking if `authorizationCases` contains `true`.
 *
 * @export
 * @param {boolean[]} authorizationCases [List of boolean values from the result of an authorization check]
 */
export function authorizeRequest(authorizationCases: boolean[]) {
  if (!authorizationCases.includes(true)) {
    throw new ResourceError(
      'Invalid access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * Authorizes read access to file metadata
 *
 * If the Learning Object is released, all requesters are authorized to read file metadata
 * If the Learning Object is in review, the author, reviewers/curators@<Learning Object Collection>, and admins/editors can read file metadata
 * If the Learning Object is unreleased or rejected only the author can read file metadata
 *
 * @param {LearningObjectSummary} learningObject
 * @param {Requester} requester
 */
export function authorizeReadAccess({
  learningObject,
  requester,
}: {
  learningObject: LearningObjectSummary;
  requester: Requester;
}) {
  const releasedAccess =
    learningObject.status === LearningObjectStatus.RELEASED;
  const authorAccess = requesterIsAuthor({
    authorUsername: learningObject.author.username,
    requester,
  });
  const isUnreleased = LearningObjectState.UNRELEASED.includes(
    learningObject.status as LearningObjectStatus,
  );
  const reviewerCuratorAccess =
    hasReadAccessByCollection({
      requester,
      collection: learningObject.collection,
    }) && !isUnreleased;
  const adminEditorAccess =
    requesterIsAdminOrEditor(requester) && !isUnreleased;

  authorizeRequest([
    releasedAccess,
    authorAccess,
    reviewerCuratorAccess,
    adminEditorAccess,
  ]);
}

/**
 * Authorizes write access to file metadata
 *
 * If the Learning Object is unreleased, only the author has write access to file metadata
 * If the Learning Object is in review, only admins/editors have write access to file metadata
 *
 * @param {LearningObjectSummary} learningObject
 * @param {Requester} requester
 */
export function authorizeWriteAccess({
  learningObject,
  requester,
}: {
  learningObject: LearningObjectSummary;
  requester: Requester;
}) {
  const isUnreleased = LearningObjectState.UNRELEASED.includes(
    learningObject.status as LearningObjectStatus,
  );
  const authorAccess =
    requesterIsAuthor({
      authorUsername: learningObject.author.username,
      requester,
    }) && isUnreleased;
  const isReleased = learningObject.status === LearningObjectStatus.RELEASED;
  const adminEditorAccess =
    requesterIsAdminOrEditor(requester) && !isUnreleased && !isReleased;
  authorizeRequest([authorAccess, adminEditorAccess]);
}
