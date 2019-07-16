import {
  UserToken,
  ServiceToken,
  AccessGroup,
  LearningObjectSummary,
  CollectionAccessMap,
} from './types';
import { DataStore } from './interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from './errors';
import { LearningObject } from './entity';

const LearningObjectState = {
  UNRELEASED: [
    LearningObject.Status.REJECTED,
    LearningObject.Status.UNRELEASED,
  ],
  IN_REVIEW: [
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
  ],
};

const PRIVILEGED_GROUPS = [
  AccessGroup.ADMIN,
  AccessGroup.EDITOR,
  AccessGroup.CURATOR,
  AccessGroup.REVIEWER,
];

/**
 * Checks if a user has the authority to modify a Learning Object.
 * If they have privileged access, immediately return true. Otherwise,
 * check if they are the owner of the Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
export async function hasLearningObjectWriteAccess(
  user: UserToken,
  dataStore: DataStore,
  objectId: string,
): Promise<boolean> {
  return hasPrivilegedWriteAccess(user, dataStore, objectId)
    ? true
    : await userIsOwner({ dataStore, user, objectId });
}

/**
 * Checks if a user has the authority to modify a multiple Learning Objects.
 * return false on the first object that the user cannot access.
 * otherwise return true
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
export async function hasMultipleLearningObjectWriteAccesses(
  user: UserToken,
  dataStore: DataStore,
  objectIds: string[],
): Promise<boolean> {
  let hasAccess = false;
  for (let i = 0; i < objectIds.length; i++) {
    hasAccess = await hasLearningObjectWriteAccess(
      user,
      dataStore,
      objectIds[i],
    );
    if (!hasAccess) {
      return hasAccess;
    }
  }
  return hasAccess;
}

/**
 * Checks if a user has the authority to modify a Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
function hasPrivilegedWriteAccess(
  user: UserToken,
  dataStore: DataStore,
  objectId: string,
) {
  if (user && user.accessGroups) {
    if (requesterIsAdminOrEditor(user)) {
      return true;
    } else {
      return checkCollectionWriteAccess({ user, dataStore, objectId });
    }
  }
}
/**
 * Checks if a user has the authority to update the data of a particular collection.
 *
 * @param user UserToken
 * @param dataStore Instance of datastore
 * @param objectId Can be a learning object id or learning name
 */
async function checkCollectionWriteAccess(params: {
  user: UserToken;
  dataStore: DataStore;
  objectId: string;
}): Promise<boolean> {
  // Regex checks to see if the given objectId string contains an id or a name
  const regexp = /^[a-f\d]{24}$/i;
  let key = '_id';
  if (!regexp.test(params.objectId)) {
    key = 'name';
  }
  let object;
  if (key === 'name') {
    object = await params.dataStore.peek<{
      collection: string;
    }>({
      query: { name: params.objectId },
      fields: { collection: 1 },
    });
  } else {
    object = await params.dataStore.peek<{
      collection: string;
    }>({
      query: { _id: params.objectId },
      fields: { collection: 1 },
    });
  }
  return (
    params.user.accessGroups.indexOf(
      `${AccessGroup.REVIEWER}@${object.collection}`,
    ) > -1 ||
    params.user.accessGroups.indexOf(
      `${AccessGroup.CURATOR}@${object.collection}`,
    ) > -1
  );
}

/**
 * Checks if the user is the owner of a Learning Object.
 *
 * @param params.user the information for the user in question
 * @param params.objectId the identifier for the Learning Object being checked
 *
 * @returns if the user is the owner or the object or not
 */
async function userIsOwner(params: {
  dataStore: DataStore;
  user: UserToken;
  objectId: string;
}) {
  const userId = await params.dataStore.findUser(params.user.username);
  const object = await params.dataStore.peek<{
    authorID: string;
  }>({
    query: { id: params.objectId },
    fields: { authorID: 1 },
  });
  return userId === object.authorID;
}

/**
 * Returns collections within user's accessGroups
 *
 * @export
 * @param {UserToken} userToken
 * @returns
 */
export function getAccessGroupCollections(userToken: UserToken) {
  const collections = [];
  if (userToken && userToken.accessGroups) {
    for (const group of userToken.accessGroups) {
      const access = group.split('@');
      collections.push(access[1]);
    }
  }
  return collections.filter(collection => !!collection);
}

/**
 * Checks if requester is a service
 *
 * @export
 * @param {ServiceToken} serviceToken
 * @returns {boolean}
 */
export function hasServiceLevelAccess(serviceToken: ServiceToken): boolean {
  if (serviceToken) {
    return isValidServiceKey(serviceToken.SERVICE_KEY);
  }
  return false;
}

/**
 * Checks if service key provided is valid
 *
 * @export
 * @param {string} key
 * @returns {boolean}
 */
function isValidServiceKey(key: string): boolean {
  return key === process.env.SERVICE_KEY;
}

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
 * Checks if requester is a privileged user by checking `accessGroups` contains a value within `PRIVILEGED_GROUPS`.
 *
 * @export
 * @param {UserToken} requester [Token data of the requester]
 * @returns {boolean}
 */
export function requesterIsPrivileged(requester: UserToken): boolean {
  if (requester && Array.isArray(requester.accessGroups)) {
    for (const group of requester.accessGroups) {
      const role = group.split('@')[0];
      if (PRIVILEGED_GROUPS.includes(role as AccessGroup)) {
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
      requester.accessGroups.includes(`${AccessGroup.CURATOR}@${collection}`) ||
      requester.accessGroups.includes(`${AccessGroup.REVIEWER}@${collection}`)
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
export function authorizeRequest(
  authorizationCases: boolean[],
  message?: string,
) {
  if (!authorizationCases.includes(true)) {
    throw new ResourceError(
      message || 'Invalid access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * Authorizes read access to Learning Object data
 *
 * If the Learning Object is released, all requesters are authorized to read Learning Object data
 * If the Learning Object is in review, the author, reviewers/curators@<Learning Object Collection>, and admins/editors can read Learning Object data
 * If the Learning Object is unreleased or rejected only the author can read Learning Object data
 *
 * @param {LearningObjectSummary} learningObject [Information about the Learning Object to authorize request]
 * @param {UserToken} requester [Information about the requester]
 */
export function authorizeReadAccess({
  learningObject,
  requester,
  message,
}: {
  learningObject: LearningObjectSummary;
  requester: UserToken;
  message?: string;
}) {
  const releasedAccess =
    learningObject.status === LearningObject.Status.RELEASED;
  const authorAccess = requesterIsAuthor({
    authorUsername: learningObject.author.username,
    requester,
  });
  const isUnreleased = LearningObjectState.UNRELEASED.includes(
    learningObject.status as LearningObject.Status,
  );
  const reviewerCuratorAccess =
    hasReadAccessByCollection({
      requester,
      collection: learningObject.collection,
    }) && !isUnreleased;
  const adminEditorAccess =
    requesterIsAdminOrEditor(requester) && !isUnreleased;

  authorizeRequest(
    [releasedAccess, authorAccess, reviewerCuratorAccess, adminEditorAccess],
    message,
  );
}

/**
 * Authorizes write access to Learning Object
 *
 * If the Learning Object is unreleased, only the author has write access to the Learning Object
 * If the Learning Object is in review, only admins/editors have write access to the Learning Object
 *
 * @param {LearningObjectSummary} learningObject [Information about the Learning Object to authorize request]
 * @param {UserToken} requester [Information about the requester]
 */
export function authorizeWriteAccess({
  learningObject,
  requester,
  message,
}: {
  learningObject: LearningObjectSummary;
  requester: UserToken;
  message?: string;
}) {
  const isUnreleased =
    LearningObjectState.UNRELEASED.includes(
      learningObject.status as LearningObject.Status,
    ) || learningObject.status === LearningObject.Status.WAITING;
  const isAuthor = requesterIsAuthor({
    authorUsername: learningObject.author.username,
    requester,
  });
  const authorAccess = isAuthor && isUnreleased;
  const isReleased = learningObject.status === LearningObject.Status.RELEASED;
  const isAdminOrEditor = requesterIsAdminOrEditor(requester);
  const adminEditorAccess = isAdminOrEditor && !isUnreleased && !isReleased;
  let reason = getInvalidWriteAccessReason({
    isAuthor,
    isAdminOrEditor,
    isReleased,
    authorAccess,
    adminEditorAccess,
  });
  authorizeRequest(
    [authorAccess, adminEditorAccess],
    message ? message + reason : null,
  );
}

/**
 * Gets the reason for writes request access being invalid
 *
 * @param {boolean} isAuthor [Whether or not the requester is the author]
 * @param {boolean} isAdminOrEditor [Whether or not the requester is an admin or editor]
 * @param {boolean} isReleased [Whether or not the Learning Object is released]
 * @param {boolean} authorAccess [Whether or not the requester has author level write access]
 * @param {boolean} adminEditorAccess [Whether or not the requester has admin/editor level write access]
 * @returns
 */
function getInvalidWriteAccessReason({
  isAuthor,
  isAdminOrEditor,
  isReleased,
  authorAccess,
  adminEditorAccess,
}: {
  isAuthor: boolean;
  isAdminOrEditor: boolean;
  isReleased: boolean;
  authorAccess: boolean;
  adminEditorAccess: boolean;
}) {
  let reason = '';
  if (!isAuthor && !isAdminOrEditor) {
    reason = ` Cannot modify another user\'s Learning Objects.`;
  } else if (isReleased) {
    reason = ' Released Learning Objects cannot be modified.';
  } else if (isAuthor && !authorAccess) {
    reason = ' Cannot modify Learning Objects that are in review.';
  } else if (isAdminOrEditor && !adminEditorAccess) {
    reason = ' Only authors can modify unsubmitted Learning Objects.';
  }
  return reason;
}

/**
 * Validates requested statuses do not contain statuses that are only accessible by an author
 *
 * If statues requested contain a restricted status, An invalid access error is thrown
 *
 * *** Restricted status filters include Working Stage statuses ***
 *
 * @param {string[]} status
 */
export function enforceNonAuthorStatusRestrictions(status: string[]) {
  if (
    status &&
    (status.includes(LearningObject.Status.REJECTED) ||
      status.includes(LearningObject.Status.UNRELEASED))
  ) {
    throw new ResourceError(
      'The statuses requested are not permitted.',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * Returns Map of collections to statuses representing read access privilege over associated collection
 *
 * @param {string[]} requestedCollections [List of collections the user has specified]
 * @param {string[]} privilegedCollections [List of collections the user has privileged access on]
 * @param {string[]} requestedStatuses [List of requested statuses]
 * @returns CollectionAccessMap
 */
export function getCollectionAccessMap(
  requestedCollections: string[],
  privilegedCollections: string[],
  requestedStatuses: string[],
): CollectionAccessMap {
  const accessMap = {};
  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = requestedStatuses;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = requestedStatuses;
    }
  }

  return accessMap;
}
