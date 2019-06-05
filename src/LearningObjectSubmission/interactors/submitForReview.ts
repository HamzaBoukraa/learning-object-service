import { SubmittableLearningObject, LearningObject } from '../../shared/entity';
import { Submission } from '../types/Submission';
import { UserToken } from '../../shared/types';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { SubmissionDataStore } from '../SubmissionDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { EntityError } from '../../shared/entity/errors/entity-error';

/**
 * submitForReview checks that the user has a verified email address, and that the Learning Object
 * passes the validation required to create a new SubmittableLearningObject. In that case, the
 * Learning Object is updated in storage to reflect it being submitted to a collection, and the
 * submission is recorded.
 *
 * @param dataStore instance of dataStore
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 * @param user metadata about current user (instance of UserToken)
 * @param collection name of collection to submit learning object to
 */
export async function submitForReview(params: {
  dataStore: SubmissionDataStore;
  user: UserToken;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  if (!params.user.emailVerified) {
    throw new ResourceError('Please verify your email address to submit a Learning Object', ResourceErrorReason.FORBIDDEN);
  }
  const object = await LearningObjectAdapter.getInstance().getLearningObjectById(params.learningObjectId);
  if (params.userId !== object.author.id) {
    throw new ResourceError('Only the Learning Object author may make a submission.', ResourceErrorReason.FORBIDDEN);
  }
  try {
    // tslint:disable-next-line:no-unused-expression
    new SubmittableLearningObject(object);
  } catch (error) {
    if (error instanceof EntityError) {
      throw new ResourceError(error.message, ResourceErrorReason.BAD_REQUEST);
    } else throw error;
  }
  await params.dataStore.submitLearningObjectToCollection(params.user.username, params.learningObjectId, params.collection);
  const submission: Submission = {
    learningObjectId: params.learningObjectId,
    collection: params.collection,
    timestamp: Date.now().toString(),
  };
  await params.dataStore.recordSubmission(submission);
  await LearningObjectAdapter.getInstance().updateReadme({
    id: params.learningObjectId,
  });
}
