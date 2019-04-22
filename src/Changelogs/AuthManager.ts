import { UserToken } from '../types';
import { DataStore } from '../interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../errors';


const ROLE = {
    ADMIN: 'admin',
    AUTHOR: 'author',
    EDITOR: 'editor',
};

export async function hasChangelogAccess(params: {
    user: UserToken,
    dataStore: DataStore,
    learningObjectId: string,
}) {
    return await determineRole({
        accessGroups: params.user.accessGroups,
        dataStore: params.dataStore,
        user: params.user,
        learningObjectId: params.learningObjectId,
    });
}

/**
 * Checks if accessGroups contains admin or editor
 *
 * @param {string[]} accessGroups
 * @returns {boolean}
 */
export async function determineRole(params: {
    dataStore: DataStore,
    user: UserToken,
    learningObjectId: string,
    accessGroups: string[],
}): Promise<string> {

    const userId = await params.dataStore.findUser(params.user.username);
    const learningObject = await params.dataStore.checkLearningObjectExistence({
        userId,
        learningObjectId: params.learningObjectId,
    });

    if (learningObject) {
        return ROLE.AUTHOR;
    }

    if (params.accessGroups && params.accessGroups.includes(ROLE.ADMIN)) {
        return ROLE.ADMIN;
    } else if (params.accessGroups && params.accessGroups.includes(ROLE.EDITOR)) {
        return ROLE.EDITOR;
    }

    throw new ResourceError(
        'Invalid access',
        ResourceErrorReason.INVALID_ACCESS,
    );
}
