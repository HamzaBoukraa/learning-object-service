/**
 * Set of reusable functions used to authorize requests within this module
 */

import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { UserToken } from '../shared/types';

enum AccessGroup {
  ADMIN = 'admin',
  EDITOR = 'editor',
  CURATOR = 'curator',
  REVIEWER = 'reviewer',
}

const privilegedGroups = [
  AccessGroup.ADMIN,
  AccessGroup.EDITOR,
  AccessGroup.CURATOR,
  AccessGroup.REVIEWER,
];

/**
 * Checks if the requester is verified by checking the `emailVerified` property on `requester`
 *
 * @export
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsVerified(requester: UserToken): boolean {
  return requester != null && requester.emailVerified;
}

/**
 * Checks if the requester is the author by comparing `authorUsername` against requester's username
 *
 * @export
 * @param {string} authorUsername [Username of the author]
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAuthor({
  authorUsername,
  requester,
}: {
  authorUsername: string;
  requester: UserToken;
}): boolean {
  return requester != null && requester.username === authorUsername;
}

/**
 * Checks if requester is a privileged user by checking `accessGroups` contains a value within `privilegedGroups`.
 *
 * @export
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsPrivileged(requester: UserToken): boolean {
  if (requester && Array.isArray(requester.accessGroups)) {
    for (const group of requester.accessGroups) {
      const role = group.split('@')[0];
      if (privilegedGroups.includes(role as AccessGroup)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if requester is an Admin by checking if their `accessGroups` contain the admin privilege
 *
 * @export
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAdmin(requester: UserToken): boolean {
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
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsEditor(requester: UserToken): boolean {
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
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsAdminOrEditor(requester: UserToken): boolean {
  return requesterIsAdmin(requester) || requesterIsEditor(requester);
}

/**
 * Checks if requester has read access by checking if their `accessGroups` contain the admin, editor, curator@collection, reviewer@collection privileges
 *
 * @export
 * @param {UserToken} requester [Token data of the requester]
 * @param {string} collection [Collection value the requester's `accessGroups` must contain]
 * @returns {boolean}
 */
export function hasReadAccessByCollection({
  requester,
  collection,
}: {
  requester: UserToken;
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
