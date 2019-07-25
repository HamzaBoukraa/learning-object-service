import { DataStore } from '../../../../shared/interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../../../../shared/errors';

/**
 * validateRequest tries to find a Learning Object
 * with the given userId and Learning Object Id.
 * If it does not find a Learning Object that matches
 * the given criteria, it throws a Resource Error.
 * @param params
 */
export async function validateRequest(params: {
  username: string,
  learningObjectId: string,
  dataStore: DataStore,
}): Promise<void> {
  const learningObject = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
  });

  if (!learningObject) {
    throw new ResourceError(
      `Learning Object with id ${params.learningObjectId} does not exist`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  if (learningObject.author.username !== params.username) {
    throw new ResourceError(
      `User ${params.username} does not own a Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
}
