import { LearningObjectGateway } from '../../interfaces';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectFile,
} from '../../typings';
import { Stubs } from '../../../tests/stubs';

export class MockLearningObjectGateway implements LearningObjectGateway {
  getReleasedLearningObjectSummary(id: string): Promise<LearningObjectSummary> {
    throw new Error('Method not implemented.');
  }
  getLearningObjectSummary(params: {
    id: string;
    requester: Requester;
  }): Promise<LearningObjectSummary> {
    throw new Error('Method not implemented.');
  }
  private stubs = new Stubs();
  updateObjectLastModifiedDate(id: string): Promise<void> {
    return Promise.resolve();
  }
}
