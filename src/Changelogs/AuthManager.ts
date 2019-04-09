import { UserToken } from "../types";
import { DataStore } from "../interfaces/DataStore";


const ROLE = {
    ADMIN: 'admin',
    EDITOR: 'editor',
};

export async function hasChangelogAccess(params: {
    user: UserToken,
    dataStore: DataStore,
    learningObjectId: string,
}) {
    return isAdminOrEditor(params.user.accessGroups)
        ? true
        : await userIsOwner({
            dataStore: params.dataStore,
            user: params.user,
            learningObjectId: params.learningObjectId,
        });
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
    learningObjectId: string;
  }) {
    const userId = await params.dataStore.findUser(params.user.username);
    if (await params.dataStore.checkLearningObjectExistence({
            userId,
            learningObjectId: params.learningObjectId,
        })) {
            return true;
        }
    return false;
}

/**
 * Checks if accessGroups contains admin or editor
 *
 * @param {string[]} accessGroups
 * @returns {boolean}
 */
export function isAdminOrEditor(accessGroups: string[]): boolean {
    return (
      accessGroups &&
      (accessGroups.includes(ROLE.ADMIN) ||
        accessGroups.includes(ROLE.EDITOR))
    );
}
