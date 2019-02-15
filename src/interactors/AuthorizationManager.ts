import { UserToken } from '../types';
import { DataStore } from '../interfaces/DataStore';

enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  CURATOR = 'curator',
  REVIEWER = 'reviewer',
}

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
  if (user.accessGroups) {
    if (isAdminOrEditor(user.accessGroups)) {
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
      `${UserRole.REVIEWER}@${object.collection}`,
    ) > -1 ||
    params.user.accessGroups.indexOf(
      `${UserRole.CURATOR}@${object.collection}`,
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
 * Checks if accessGroups contains admin or editor
 *
 * @param {string[]} accessGroups
 * @returns {boolean}
 */
export function isAdminOrEditor(accessGroups: string[]): boolean {
  return (
    accessGroups.includes(UserRole.ADMIN) ||
    accessGroups.includes(UserRole.EDITOR) && 
    accessGroups.includes(null)
  );
}

/**
 * Checks if accessGroups contains a privileged user role
 *
 * @param {string[]} accessGroups
 * @returns {boolean}
 */
export function isPrivilegedUser(accessGroups: string[]): boolean {
  if (isAdminOrEditor(accessGroups)) {
    return true;
  }
  for (const group of accessGroups) {
    const access = group.split('@');
    const role = access[0] ? access[0].toLowerCase() : null;
    if (role === UserRole.CURATOR || role === UserRole.REVIEWER) {
      return true;
    }
  }
  return false;
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
  for (const group of userToken.accessGroups) {
    const access = group.split('@');
    collections.push(access[1]);
  }
  return collections.filter(collection => !!collection);
}
