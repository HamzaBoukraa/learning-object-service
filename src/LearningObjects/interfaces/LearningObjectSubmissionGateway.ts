export abstract class LearningObjectSubmissionGateway {
    abstract deletePreviousRelease(params: { learningObjectId: string }): void;
}
