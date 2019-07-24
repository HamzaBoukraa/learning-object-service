import { LearningObjectGateway } from '../LearningObjectGateway';
import { Requester } from '../typings';
import { LearningObjectSummary } from '../../shared/types';
import { Stubs } from '../../tests/stubs';
import { LearningObject } from '../../shared/entity';
import { STUB_CHANGELOG_IDS } from './ChangelogStubs';

export class StubModuleLearningObjectGateway implements LearningObjectGateway {
    stubs = new Stubs();

    async getReleasedLearningObjectSummary(params: {
        requester: Requester;
        id: string;
    }): Promise<LearningObjectSummary> {
        return new LearningObject({
            ...this.stubs.learningObject,
            id: STUB_CHANGELOG_IDS.MINUS_REVISION,
        });
    }
}
