import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { LearningObjectSummary, UserToken } from '../../shared/types';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';

export interface LearningObjectGateway {
  getLearningObject(learningObjectId: string, requester: UserToken): Promise<LearningObjectSummary>;
}

export class ModuleLearningObjectGateway implements LearningObjectGateway {
  private adapter: LearningObjectAdapter;

  constructor() {
    this.adapter = LearningObjectAdapter.getInstance();
  }

  /**
   * Reetrieves a Learning Object by id
   *
   * Attempts to retrieve first from the released copy and then, failing that, attempts to retrieve
   * the working copy, performing authorization against the requester's UserToken
   *
   * @param {string} learningObjectId the id of the Learning Object to retrieve
   * @param {UserToken} requester the user token of the reauester
   * @returns {Promise<LearningObjectSummary>}
   * @memberof ModuleLearningObjectGateway
   */
  async getLearningObject(learningObjectId: string, requester: UserToken): Promise<LearningObjectSummary> {
    try {
      let learningObject: LearningObjectSummary = await this.adapter.getReleasedLearningObjectSummary(learningObjectId);
      return learningObject;
    } catch (error) {
      if (error instanceof ResourceError && error.name === ResourceErrorReason.NOT_FOUND) {
        // handle the not found error and check for a working-copy
        return await this.adapter.getWorkingLearningObjectSummary({ id: learningObjectId, requester });
      } else {
        throw error;
      }
    }
  }

}

