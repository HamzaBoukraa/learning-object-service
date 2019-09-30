import { Drivers } from '../shared/dependencies';
import { LearningObject } from '../../../shared/entity';

export async function duplicateRevisionFiles(params: {
    authorUsername: string;
    learningObjectId: string;
    currentLearningObjectVersion: number;
    newLearningObjectVersion: number;
}): Promise<void> {
    const { authorUsername, learningObjectId, currentLearningObjectVersion, newLearningObjectVersion } = params;

    await Drivers.fileManager().copyDirectory({
        authorUsername,
        learningObjectId,
        currentLearningObjectVersion,
        newLearningObjectVersion,
    });
}
