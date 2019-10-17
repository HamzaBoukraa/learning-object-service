import { LearningObjectSubmissionGateway } from '../../interfaces/LearningObjectSubmissionGateway';
import { LearningObjectSubmissionAdapter } from '../../../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';

export class ModuleLearningObjectSubmissionGateway implements LearningObjectSubmissionGateway {
    async deletePreviousRelease(params: { learningObjectId: string; }): Promise<void> {
        await LearningObjectSubmissionAdapter.getInstance().deletePreviousRelease({ learningObjectId: params.learningObjectId });
    }
}
