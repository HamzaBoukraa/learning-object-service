import { TopicsDatastore } from '../../interfaces/datastore/TopicsDatastore';
import { LearningObject } from '../../../shared/entity';
import { Db } from 'mongodb';
import { MongoConnector } from '../../../shared/MongoDB/MongoConnector';
import { mapLearningObjectDocumentsToLearningObjects } from './mappers/mapLearningObjectDocumentsToLearningObjects';

const LEARNING_OBJECT_COLLLECTION = 'objects';

export class MongoDBTopicsDatastore implements TopicsDatastore {
    db: Db;
    constructor() {
        this.db = MongoConnector.client().db();
    }

    async getLearningObjectsByTopic(topic: string): Promise<LearningObject[]> {
        const learningObjectDocuments = await this.db.collection(LEARNING_OBJECT_COLLLECTION).find({ topic }).toArray();

        const learningObjects = await mapLearningObjectDocumentsToLearningObjects(learningObjectDocuments);

        return learningObjects;
    }
}

