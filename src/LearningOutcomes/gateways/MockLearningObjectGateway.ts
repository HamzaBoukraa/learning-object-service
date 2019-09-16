import { LearningObjectGateway } from './ModuleLearningObjectGateway';
import { UserToken } from '../../shared/types';
import { LearningObject } from '../../shared/entity';

export class MockLearningObjectGateway implements LearningObjectGateway {

  getLearningObject(learningObjectId: string, requester: UserToken): Promise<LearningObject> {
    return Promise.resolve(new LearningObject());
  }
}
