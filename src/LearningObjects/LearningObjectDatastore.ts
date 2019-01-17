import { Db } from "mongodb";
import { COLLECTIONS } from "../drivers/MongoDriver";

export class LearningObjectDataStore {
    
    constructor(private db: Db) { }

    async getRecentChangelog(learningObjectId: string): Promise<any> {
        try {
            const cursor = await this.db
                .collection(COLLECTIONS.CHANGLOG)
                .aggregate([
                    {
                        $match: {
                            learningObjectId: learningObjectId,
                        }
                    },
                    {
                        $project: 
                        {
                            learningObjectId: 1,
                            recentChangelog: { $arrayElemAt: [ "$logs", -1 ] }
                        }
                    }
                ])
            const documents = await cursor.toArray();
            const changelog = documents[0];
            return changelog;
        } catch (e) {
            console.error(e);
            return Promise.reject(e);
        }
    }

    async deleteChangelog(learningObjectId: string): Promise<void> {
        try {
            await this.db  
                .collection(COLLECTIONS.CHANGLOG)
                .remove({learningObjectId: learningObjectId});
        } catch(e) {
            console.error(e);
            return Promise.reject(e);
        }
    }
}