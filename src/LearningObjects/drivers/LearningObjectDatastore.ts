import { Db } from 'mongodb';
import { LearningObject } from '../../shared/entity';
import { COLLECTIONS } from '../../drivers/MongoDriver';
import {
    generateInternalLearningObjectFromDocument,
} from '../../shared/MongoDB/HelperFunctions/generateLearningObject/generateLearningObject';

export class LearningObjectDataStore {
    constructor(private db: Db) { }

    /**
     * Fetch the learning object document associated with the given id.
     * @async
     *
     * @param learningObjectID
     *
     * @returns {LearningObjectRecord}
     */
    async fetchInternalLearningObject(
        learningObjectID: string,
    ): Promise<LearningObject | Error> {
        const document = await this.db
            .collection(COLLECTIONS.LEARNING_OBJECTS)
            .findOne({ _id: learningObjectID });
        if (document) {
            return generateInternalLearningObjectFromDocument(document);
        }
        throw new Error('Database item not found');
    }
}

