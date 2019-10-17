import { Drivers } from '../shared/dependencies';
import { LearningObject } from '../../../shared/entity';

export async function duplicateRevisionFiles(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    newLearningObjectVersion: number;
}): Promise<void> {
    const { authorUsername, learningObjectCUID, version, newLearningObjectVersion } = params;

    await Drivers.fileManager().copyDirectory({
        authorUsername,
        learningObjectCUID,
        version,
        newLearningObjectVersion,
    });
}
