import { LearningObject } from '../../../shared/entity';
import { UserToken, LearningObjectSummary } from '../../../shared/types';
import { LearningObjectGateway } from '../../interfaces/LearningObjectGateway';
import { LearningObjectAdapter } from '../../../LearningObjects/adapters/LearningObjectAdapter';
import { Requester } from '../../typings';
import { LearningObjectFilter } from '../../../LearningObjects/typings';

export class ModuleLearningObjectGateway implements LearningObjectGateway {
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

  getLearningObjectSummary(params: {
    id: string;
    requester: UserToken;
  }): Promise<LearningObjectSummary> {
    return this.adapter.getLearningObjectSummary(params);
  }

  getLearningObjectByCuid(params: {
    username: string;
    cuid: string;
    version: number;
    requester: UserToken;
    revision: boolean;
  }): Promise<LearningObjectSummary[]> {
    return this.adapter.getLearningObjectByCuid({
      username: params.username,
      cuid: params.cuid,
      version: params.version,
      userToken: params.requester,
    });
  }

  getLearningObjectById(params: {
    learningObjectId: string;
    requester?: UserToken;
    filter?: LearningObjectFilter;
  }): Promise<LearningObject> {
    return this.adapter.getLearningObjectById({
      id: params.learningObjectId,
      requester: params.requester,
      filter: params.filter,
    });
  }
}
