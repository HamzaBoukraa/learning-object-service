import { UserToken } from '../types';
import { DataStore } from '../shared/interfaces/DataStore';
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
