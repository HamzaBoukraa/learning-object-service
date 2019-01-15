import { Db } from "mongodb";

export class LearningObjectDataStore {
    
    constructor(private db: Db) { }

    async getRecentChangelog(learningObjectId: string): Promise<any> {
        try {
            const cursor = await this.db
                .collection('changelogs')
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
                            recentChangelog: { $arrayElemAt: [ "$logs", -1] }
                        }
                    }
                ])
            const documents = await cursor.toArray();
            console.log(documents);
            const changelog = documents[0];
            return changelog;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async deleteChanglog(learningObjectId: string): Promise<void> {
        try {
            await this.db  
                .collection('changelogs')
                .remove({learningObjectId: learningObjectId});
        } catch(e) {
            console.error(e);
            return Promise.reject(e);
        }
    }
}