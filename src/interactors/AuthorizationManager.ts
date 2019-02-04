import { UserToken } from '../types';
import { DataStore } from '../interfaces/DataStore';

/**
 * Checks if a user has the authority to modify a Learning Object.
 * If they have privileged access, immediately return true. Otherwise,
 * check if they are the owner of the Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
export async function hasLearningObjectWriteAccess(user: UserToken, dataStore: DataStore, objectId: string): Promise<boolean> {
  return hasPrivilegedAccess(user, dataStore, objectId) ? true : await userIsOwner({dataStore, user, objectId});
}

/**
 * Checks if a user has the authority to modify a Learning Object.
 * If they have privileged access, immediately return true. Otherwise,
 * check if they are the owner of the Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
export async function hasMultipleLearningObjectWriteAccesses(user: UserToken, dataStore: DataStore, objectIds: string[]): Promise<boolean> {
  let hasAccess = false;
  for(let i = 0; i < objectIds.length; i++) {
    hasAccess = await hasLearningObjectWriteAccess(user, dataStore, objectIds[i]);
    if (!hasAccess) {
      return hasAccess;
    }
  }
  return hasAccess
}

/**
 * Checks if a user has the authority to modify a Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
function hasPrivilegedAccess(user: UserToken, dataStore: DataStore, objectId: string) {
  if (user.accessGroups) {
    if (user.accessGroups.indexOf('admin') > -1 || user.accessGroups.indexOf('editor') > -1) {
      return true;
    } else {
      return checkCollectionWriteAccess({user, dataStore, objectId});
    }
  }
}
/**
 * Checks if a user has the authority to update the data of a particular collection.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
async function checkCollectionWriteAccess(params: { user: UserToken, dataStore: DataStore, objectId: string }): Promise<boolean> {
  const regexp = new RegExp('/^[a-f\d]{24}$/i');
  let property = '_id';
  if (!regexp.test(params.objectId)) {
    property = 'name';
  } 
  let object;
  if(property === 'name') {
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
  return (params.user.accessGroups.indexOf(`reviewer@${object.collection}`) > -1 || params.user.accessGroups.indexOf(`curator@${object.collection}`) > -1);
}

/**
 * Checks if the user is the owner of a Learning Object.
 *
 * @param params.user the information for the user in question
 * @param params.objectId the identifier for the Learning Object being checked
 *
 * @returns if the user is the owner or the object or not
 */
async function userIsOwner(params: { dataStore: DataStore; user: UserToken; objectId: string;}) {
  const userId = await params.dataStore.findUser(params.user.username);
  const object = await params.dataStore.peek<{
    authorID: string;
  }>({
    query: { id: params.objectId },
    fields: { authorID: 1 },
  });
  return userId === object.authorID;
}

