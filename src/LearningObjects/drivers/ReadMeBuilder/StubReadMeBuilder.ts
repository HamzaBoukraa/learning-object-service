import { ReadMeBuilder } from '../../interfaces';
import { LearningObject } from '../../../shared/entity';

export class StubReadMeBuilder implements ReadMeBuilder {
  buildReadMe(learningObject: LearningObject): Promise<Buffer> {
    return Promise.resolve(new Buffer(''));
  }
}
