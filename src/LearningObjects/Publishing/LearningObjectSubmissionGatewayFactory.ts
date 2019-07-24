import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { StubLearningObjectSubmissionGateway } from './StubLearningObjectSubmissionGateway';
import { ModuleLearningObjectSubmissionGateway } from './ModuleLearningObjectSubmissionGateway';

export class LearningObjectSubmissionGatewayFactory {

    /**
     * Creates an instance of LearningObjectSubmissionGateway
     * Determines which LearningObjectSubmissionGateway to use by looking
     * at NODE_ENV.
     */
    private constructor() {}

    static buildGateway(): LearningObjectSubmissionGateway {
        const learningObjectSubmissionGateway =
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'testing' ?
            new StubLearningObjectSubmissionGateway() :
            new ModuleLearningObjectSubmissionGateway();
        return learningObjectSubmissionGateway;
    }
}
