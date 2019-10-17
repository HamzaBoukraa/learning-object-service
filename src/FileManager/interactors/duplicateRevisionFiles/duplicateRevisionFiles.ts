import { Drivers } from '../shared/dependencies';
import { LearningObject } from '../../../shared/entity';

export async function duplicateRevisionFiles(params: {
    authorUsername: string;
    learningObjectCUID: string;
    currentLearningObjectVersion: number;
    newLearningObjectVersion: number;
}): Promise<void> {
    const { authorUsername, learningObjectCUID, currentLearningObjectVersion, newLearningObjectVersion } = params;

    await Drivers.fileManager().copyDirectory({
        authorUsername,
        learningObjectCUID,
        currentLearningObjectVersion,
        newLearningObjectVersion,
    });
}
