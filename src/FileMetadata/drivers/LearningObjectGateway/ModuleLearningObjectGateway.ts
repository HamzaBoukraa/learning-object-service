import { LearningObjectGateway } from '../../interfaces';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectFile,
} from '../../typings';
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
   * Proxies `getReleasedFile` request to LearningObjectAdapter
   *
   * @memberof ModuleLearningObjectGateway
   */
  getReleasedFile(params: {
    requester: Requester;
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
  getReleasedFiles(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectFile[]> {
    return this.adapter.getReleasedFiles(params);
  }
}
