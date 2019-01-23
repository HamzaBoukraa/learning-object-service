import { Db } from "mongodb";
import { COLLECTIONS } from "../drivers/MongoDriver";
import { ChangeLogDocument } from "../types/Changelog";

export class LearningObjectDataStore {
    
    constructor(private db: Db) { }

    /**
   * Get a changelog object with the last element in the logs array 
   * The last element in the logs array is the most recent changelog
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument} A single changelog object with only the last element in the logs array
   */
    async getRecentChangelog(learningObjectId: string): Promise<ChangeLogDocument> {
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

    /**
   * Removes an entire document from the changelogs collection. This function is only triggered when its 
   * corresponding learning object is deleted.
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {void} 
   */
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