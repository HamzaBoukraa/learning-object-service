import { LearningObject } from '../../../shared/entity';
import { UserToken } from '../../../shared/types';
import { LearningObjectGateway } from '../../interfaces/LearningObjectGateway';
import { LearningObjectAdapter } from '../../../LearningObjects/adapters/LearningObjectAdapter';


export class ModuleLearningObjectGateway extends LearningObjectGateway {
   private adapter: LearningObjectAdapter = LearningObjectAdapter.getInstance();

  /**
   * @inheritdoc
   *
   * Proxies `getLearningObjectById` request to LearningObjectAdapter
   *
   * @param {string} id
   * @param {UserToken} requester
   * @returns {Promise<LearningObject>}
   * @memberof ModuleLearningObjectGateway
   */
  getLearningObjectById(params: {
    id: string;
    requester: UserToken;
  }): Promise<LearningObject> {
    return this.adapter.getLearningObjectById(params);
  }
}
