import { ChangeLogDocument } from '../../shared/types/changelog';

export interface ChangelogDataStore {
    /**
     * createChangelog is responsible for orchestrating
     * the creation of a change log in the system.
     * @param {
     *  learningObjectId string
     *  author {
     *      userId string
     *      name string
     *      role string
     *      profileImage string
     *  }
     *  changelogText string
     * }
     */
    createChangelog(params: {
        learningObjectId: string,
        author: {
            userId: string,
            name: string,
            role: string,
            profileImage: string,
        },
        changelogText: string,
    }): Promise<void>;

    /**
     * getRecentChangelog is responsible for retrieving
     * the newest change log for a given Learning Object
     * @param { learningObjectId string }
     */
    getRecentChangelog(params: {
        learningObjectId: string,
    }): Promise<ChangeLogDocument>;

    /**
     * fetchAllChangelog is responsible for retrieving
     * all change logs for a given Learning Object
     * @param { learningObjectId string }
     */
    fetchAllChangelogs(params: {
        learningObjectId: string,
    }): Promise<ChangeLogDocument[]>;

    /**
     * fetchChangelogsBeforeDate is responsible for retrieving
     * all of the change logs that were created before a given date
     * for a given Learning Object
     * @param {
     *  learningObjectId string
     *  date string
     * }
     */
    fetchChangelogsBeforeDate(params: {
        learningObjectId: string,
        date: string,
    }): Promise<ChangeLogDocument[]>;

    /**
     * fetchRecentChangelogsBeforeDate is responsible for retrieving
     * the newest change logs that was created before a given date
     * for a given Learning Object
     * @param {
     *  learningObjectId string
     *  date string
     * }
     */
    fetchRecentChangelogBeforeDate(params: {
        learningObjectId: string,
        date: string,
    }): Promise<ChangeLogDocument>;

    /**
     * deleteChangelog is responsible for deleting
     * a change log for a given Learning Object
     * @param { learningObjectId string }
     */
    deleteChangelog(params: {
        learningObjectId: string,
    }): Promise<void>;
}
