import { LearningObjectGateway } from './LearningObjectGateway';
import { LearningObjectAdapter } from '../LearningObjects/adapters/LearningObjectAdapter';
import { LearningObjectSummary } from '../shared/types';
import { Requester } from './typings';

export class ModuleLearningObjectGateway implements LearningObjectGateway {
  private adapter: LearningObjectAdapter = LearningObjectAdapter.getInstance();

  /**
   * @inheritdoc
   *
   * Proxies `getWorkingLearningObjectSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getReleasedLearningObjectSummary(params.id);
  }

  /**
   * * Proxies `getLearningObjectByCuid` request to LearningObjectAdapter
   *
   * @param {{
   *     requester: Requester,
   *     cuid: string,
   *   }} params
   * @returns
   * @memberof ModuleLearningObjectGateway
   */
  getLearningObjectByCuid(params: {
    requester: Requester,
    cuid: string,
  }) {
    return this.adapter.getLearningObjectByCuid(params.cuid, params.requester);
  }
}
