/**
 * Set of reusable functions used to authorize requests within this module
 */

import { Requester } from './typings';

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
 * Checks if requester is a privileged user by checking `accessGroups` contains a value within `privilegedGroups`.
 *
 * @export
 * @param {Requester} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsPrivileged(requester: Requester): boolean {
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
