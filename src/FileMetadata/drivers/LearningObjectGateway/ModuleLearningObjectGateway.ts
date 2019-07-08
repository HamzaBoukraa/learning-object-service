import { LearningObjectGateway } from '../../interfaces';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectFile,
} from '../../typings';
import { LearningObjectAdapter } from '../../../LearningObjects/adapters/LearningObjectAdapter';
import { UserToken } from '../../../shared/types';
import { LearningObject } from '../../../shared/entity';

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
   * Proxies `getReleasedFile` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedFile(params: {
    id: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    return this.adapter.getReleasedFile(params);
  }
  /**
   * @inheritdoc
   *
   * Proxies `getReleasedFiles` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedFiles(id: string): Promise<LearningObjectFile[]> {
    return this.adapter.getReleasedFiles(id);
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
