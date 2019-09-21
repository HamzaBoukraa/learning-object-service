import { LearningObjectGateway } from '../../interfaces';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectFile,
} from '../../typings';
import { LearningObjectAdapter } from '../../../LearningObjects/adapters/LearningObjectAdapter';

export class ModuleLearningObjectGateway extends LearningObjectGateway {
  private adapter: LearningObjectAdapter = LearningObjectAdapter.getInstance();

  /**
   * @inheritdoc
   *
   * Proxies `getReleasedLearningObjectSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedLearningObjectSummary(id: string): Promise<LearningObjectSummary> {
    return this.adapter.getReleasedLearningObjectSummary(id);
  }

  /**
   *
   * @param learningObjectId The mongo Id of a learning object in the database
   */
  getLearningObjectSummary(params: {
    id: string;
    requester: Requester;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getLearningObjectSummary(params);
  }
  /**
   * @inheritdoc
   *
   * Proxies `updateObjectLastModifiedDate` request to LearningObjectAdapter
   *
   * @param {string} id
   * @returns {Promise<void>}
   * @memberof ModuleLearningObjectGateway
   */
  updateObjectLastModifiedDate(id: string): Promise<void> {
    return this.adapter.updateObjectLastModifiedDate(id);
  }
}
