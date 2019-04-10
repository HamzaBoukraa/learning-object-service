import { DataStore } from '../interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../errors';


/**
 * Throws an error if request is invalid
 * User must have verified email and the object must exist
 * for learning object id and user id pair.
 *
 * @param dataStore instance of dataStore
 * @param collection name of collection to search for
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 */
export async function authorizeSubmissionRequest(params: {
    dataStore: DataStore,
    emailVerified: boolean,
    userId: string,
    learningObjectId: string,
  }): Promise<void> {
    if (!params.emailVerified) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }

    if (!(await params.dataStore.checkLearningObjectExistence({
      learningObjectId: params.learningObjectId,
      userId: params.userId,
    }))) {
      throw new ResourceError(
        `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
}
