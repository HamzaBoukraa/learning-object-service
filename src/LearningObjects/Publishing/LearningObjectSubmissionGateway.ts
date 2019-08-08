import { UserToken, LearningObjectMetadataUpdates } from '../../shared/types';
import { LearningObject } from '../../shared/entity';

export abstract class LearningObjectSubmissionGateway {
  /**
   * Remove a Learning Object submission
   * for a given Learning Object
   *
   * @abstract
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @returns {Promise<void>}
   * @memberof LearningObjectSubissionGateway
   */
  abstract deleteSubmission(params: {
    learningObjectId: string;
    authorUsername: string;
    user: UserToken;
  }): Promise<void>;

  /**
   * Update a Submission for a given Learning Object.
   *
   * @abstract
   * @param {string} params.learningObjectId The id of the Learning Object corresponding to a Submission.
   * @param {Partial<LearningObject>} params.updates The changes to be applied to a submission.
   * @param {UserToken} params.user the identity of a user attempting to update a submission.
   */
  abstract updateSubmission(params: {
    learningObjectId: string;
    updates: LearningObjectMetadataUpdates;
    user: UserToken;
  }): Promise<void>;
}
