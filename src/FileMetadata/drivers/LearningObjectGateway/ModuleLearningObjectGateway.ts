import { LearningObjectGateway } from '../../interfaces';
import { Requester, LearningObjectSummary } from '../../typings';
import { LearningObjectAdapter } from '../../../LearningObjects/LearningObjectAdapter';

export class ModuleLearningObjectGateway extends LearningObjectGateway {
  private adapter: LearningObjectAdapter = LearningObjectAdapter.getInstance();

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
   * Proxies `getActiveLearningObjectSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getActiveLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getActiveLearningObjectSummary(params);
  }

  /**
   * @inheritdoc
   *
   * Proxies `getLearningObjectRevisionSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getLearningObjectRevisionSummary(params: {
    requester: Requester;
    id: string;
    revision: number;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getLearningObjectRevisionSummary(params);
  }
}
