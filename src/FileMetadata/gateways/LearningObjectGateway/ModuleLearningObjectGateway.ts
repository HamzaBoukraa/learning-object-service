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
   * @inheritdoc
   *
   * Proxies `getWorkingLearningObjectSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getWorkingLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getWorkingLearningObjectSummary(params);
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
