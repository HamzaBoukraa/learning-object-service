import { LearningObject } from '../../../shared/entity';
import { UserToken, LearningObjectSummary } from '../../../shared/types';
import { LearningObjectGateway } from '../../interfaces/LearningObjectGateway';
import { LearningObjectAdapter } from '../../../LearningObjects/adapters/LearningObjectAdapter';
import { Requester } from '../../typings';


export class ModuleLearningObjectGateway implements LearningObjectGateway {
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
   * Proxies `getReleasedLearningObjectSummary` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedLearningObjectSummary(
    id: string,
  ): Promise<LearningObjectSummary> {
    return this.adapter.getReleasedLearningObjectSummary(id);
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
}
