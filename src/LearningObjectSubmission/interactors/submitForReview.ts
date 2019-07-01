import { SubmittableLearningObject, LearningObject } from '../../shared/entity';
import { Submission } from '../types/Submission';
import { UserToken } from '../../shared/types';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { SubmissionDataStore } from '../SubmissionDatastore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { EntityError } from '../../shared/entity/errors/entity-error';
import { SubmissionPublisher } from './SubmissionPublisher';

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
  publisher: SubmissionPublisher;
  user: UserToken;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  const object = await LearningObjectAdapter.getInstance().getLearningObjectById({ id: params.learningObjectId, requester: params.user, filter: 'unreleased' });
  verifyIsSubmittable(params, object);

  await updateLearningObjectFields(params);

  await params.dataStore.recordSubmission({
    learningObjectId: params.learningObjectId,
    collection: params.collection,
    timestamp: Date.now().toString(),
  });
  // The decision to fetch the Learning Object again was made to ensure consistency, in the chance that the business
  // logic used when updating a Learning Object modifies a property other than the ones we specifically request.
  const submittableLearningObject = await LearningObjectAdapter.getInstance().getLearningObjectById({ id: params.learningObjectId, requester: params.user, filter: 'unreleased' });
  await params.publisher.publishSubmission(submittableLearningObject);
}

/**
 * updateLearningObjectFields makes requests to update fields on the Learning Object that are affected by
 * the creation of a submission. Additionally, it requests the README file for the Learning Object is
 * regenerated to ensure that it has up-to-date information when viewed by a reviewer.
 * @param params.dataStore storage for Learning Object submissions
 * @param params.user the user requesting a submission be made for this Learning Object
 * @param params.learningObjectId id of the learning object to search for
 * @param params.collection name of collection to submit the Learning Object to
 */
async function updateLearningObjectFields(params: { user: UserToken; learningObjectId: string; collection: string; }) {
  const LearningObjectGateway = LearningObjectAdapter.getInstance();
  await LearningObjectGateway.updateLearningObject({
    id: params.learningObjectId,
    userToken: params.user,
    updates: {
      published: true,
      status: LearningObject.Status.WAITING,
      collection: params.collection,
    },
  });
  await LearningObjectGateway.updateReadme({
    id: params.learningObjectId,
  });
}

/**
 * verifyIsSubmittable checks that a user is authorized to make a submission, and that
 * the request made is valid based on defined business rules.
 *
 * If the request is invalid for any reason, an error will be thrown. Otherwise, the interactor
 * may proceed to make the submission.
 * @param params.user the user requesting a submission be made for this Learning Object
 * @param params.userId the ID of the requesting user
 * @param object the Learning Object to submit
 */
function verifyIsSubmittable(params: { user: UserToken; userId: string; }, object: LearningObject) {
  if (params.userId !== object.author.id) {
    throw new ResourceError('Only the Learning Object author may make a submission.', ResourceErrorReason.FORBIDDEN);
  }
  if (!params.user.emailVerified) {
    throw new ResourceError('Please verify your email address to submit a Learning Object', ResourceErrorReason.FORBIDDEN);
  }
  try {
    // tslint:disable-next-line:no-unused-expression
    new SubmittableLearningObject(object);
  } catch (error) {
    if (error instanceof EntityError) {
      throw new ResourceError(error.message, ResourceErrorReason.BAD_REQUEST);
    } else throw error;
  }
}
