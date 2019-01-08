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
export async function hasLearningObjectWriteAccess(user: UserToken, collection: string, dataStore: DataStore, objectId: string): Promise<boolean> {
  return hasPrivilegedAccess(user, collection) ? true : await userIsOwner({dataStore, user, objectId});
}

/**
 * Checks if a user has the authority to modify a Learning Object.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
function hasPrivilegedAccess(user: UserToken, collection: string) {
  if (user.accessGroups) {
    if (user.accessGroups.includes('admin') || user.accessGroups.includes('editor')) {
      return true;
    } else {
      return checkCollectionWriteAccess(user, collection);
    }
  }
}
/**
 * Checks if a user has the authority to update the data of a particular collection.
 *
 * @param user information about the user who has initiated a privileged write operation
 * @param collection the name of the collection
 */
function checkCollectionWriteAccess(user: UserToken, collection: string): boolean {
  return user.accessGroups.includes(`lead@${collection}`) || user.accessGroups.includes(`curator@${collection}`);
}

/**
 * Checks to see if user has required permissions
 *
 * @param {({
 *     dataStore: DataStore;
 *     user: UserToken;
 *     objectId: string;
 *     requiredPermission: 'owner' | 'public';
 *   })} params
 * @param {boolean} [enforceAdminPrivileges=true]
 * @returns {Promise<void>}
 */
export async function checkAuthorization(
  params: {
    dataStore: DataStore;
    user: UserToken;
    objectId: string;
    requiredPermission: 'owner' | 'public';
  },
): Promise<void> {
  // If the user is an admin, and we want to provide admins privileged access THEN return successfully
  if (params.user.accessGroups.includes('admin')) {
    return;
  }
  switch (params.requiredPermission) {
    case 'owner':
      if (!(await userIsOwner(params))) {
        throw new Error('');
      }
      break;
    case 'public':
      const publishedDoc = await params.dataStore.peek<{ published: boolean }>({
        query: { id: params.objectId },
        fields: { published: 1 },
      });
      if (!publishedDoc.published) {
        throw new Error(``);
      }
      break;
    default:
      break;
  }
}

/**
 * Checks if the user is the owner of a Learning Object.
 *
 * @param params.user the information for the user in question
 * @param params.objectId the identifier for the Learning Object being checked
 *
 * @returns if the user is the owner or the object or not
 */
async function userIsOwner(params: { dataStore: DataStore; user: UserToken; objectId: string; }) {
  const userId = await params.dataStore.findUser(params.user.name);
  const object = await params.dataStore.peek<{
    authorID: string;
  }>({
    query: { id: params.objectId },
    fields: { authorID: 1 },
  });
  return userId === object.authorID;
}

