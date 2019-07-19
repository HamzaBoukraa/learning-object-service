import { UserToken } from '../../shared/types';

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
        learningObjectId: string,
        authorUsername: string;
        user: UserToken;
    }): Promise<void>;
}
