import { UserToken } from '../shared/types';
import { DataStore } from '../shared/interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../shared/errors';


const ROLE = {
    ADMIN: 'admin',
    AUTHOR: 'author',
    EDITOR: 'editor',
};

/**
 * hasChangelogAccess finds the given user
 * and checks to see if the user is the author
 * of the given Learning Object. If not, the function
 * checks to see if the user is an admin or editor in the
 * system.
 *
 * Note: It may seem less efficient to check for author access
 * before admin and editor access. This is done of purpose because
 * an author of a Learning Object can be an admin or editor. If
 * an admin or editor creates a Learning Object and leaves a change log
 * on it, the role should be stored as author and not admin or editor.
 *
 * @param {
 *  user UserToken
 *  dataStore DataStore
 *  learningObjectId string
 * }
 */
export async function hasChangelogAccess(params: {
    user: UserToken,
    dataStore: DataStore,
    learningObjectId: string,
}) {

    const userId = await params.dataStore.findUser(params.user.username);
    const isOwnedByAuthor = await params.dataStore.checkLearningObjectExistence({
        userId,
        learningObjectId: params.learningObjectId,
    });

    if (isOwnedByAuthor) {
        return ROLE.AUTHOR;
    }

    if (params.user.accessGroups && params.user.accessGroups.includes(ROLE.ADMIN)) {
        return ROLE.ADMIN;
    } else if (params.user.accessGroups && params.user.accessGroups.includes(ROLE.EDITOR)) {
        return ROLE.EDITOR;
    }

    throw new ResourceError(
        'Invalid access',
        ResourceErrorReason.INVALID_ACCESS,
    );
}
