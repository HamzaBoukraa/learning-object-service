import { LearningObjectGateway } from '../../interfaces';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectFile,
} from '../../typings';
import { Stubs } from '../../../tests/stubs';

export class MockLearningObjectGateway implements LearningObjectGateway {
  private stubs = new Stubs();
  getWorkingLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary> {
    return Promise.resolve(this.stubs.learningObject);
  }
  getReleasedFile(params: {
    id: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    return Promise.resolve(this.stubs.learningObjectFile);
  }
  getReleasedFiles(id: string): Promise<LearningObjectFile[]> {
    return Promise.resolve([this.stubs.learningObjectFile]);
  }
  updateObjectLastModifiedDate(id: string): Promise<void> {
    return Promise.resolve();
  }
}
