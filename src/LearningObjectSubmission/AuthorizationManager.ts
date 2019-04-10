import { DataStore } from '../interfaces/DataStore';
import { ResourceError, ResourceErrorReason } from '../errors';

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
