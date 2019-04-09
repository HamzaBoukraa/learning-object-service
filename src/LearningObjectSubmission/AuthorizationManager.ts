import { DataStore } from '../interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../errors';

export async function authorizeSubmissionRequest(params: {
    dataStore: DataStore,
    username: string,
    userId: string,
    learningObjectId: string,
  }): Promise<void> {
    const user = await params.dataStore.fetchUser(params.username);
    if (!user.emailVerified) {
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
