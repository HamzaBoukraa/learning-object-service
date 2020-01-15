import { UserServiceGateway } from '../../../../shared/gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '../../../../shared/MongoDB/HelperFunctions';
import { LearningObject } from '../../../../shared/entity';
import { LearningObjectDocument } from '../../../../shared/types';

export async function mapLearningObjectDocumentsToLearningObjects(learningObjectDocuments: LearningObjectDocument[]): Promise<LearningObject[]> {

    return await Promise.all(learningObjectDocuments.map(async learningObjectDocument => {
        const author = await UserServiceGateway.getInstance().queryUserById(
            learningObjectDocument.authorID,
        );
        return await mongoHelperFunctions.generateLearningObject(author, learningObjectDocument, true);
    }));
}

