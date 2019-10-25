import { ChangeLogDocument } from '../../shared/types/changelog';

export interface ChangelogDataStore {
    /**
     * createChangelog is responsible for orchestrating
     * the creation of a change log in the system.
     * @param {
     *  cuid string
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
        cuid: string,
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
     * @param { cuid string }
     */
    getRecentChangelog(params: {
        cuid: string,
    }): Promise<ChangeLogDocument>;

    /**
     * fetchAllChangelog is responsible for retrieving
     * all change logs for a given Learning Object
     * @param { cuid string }
     */
    fetchAllChangelogs(params: {
        cuid: string,
    }): Promise<ChangeLogDocument[]>;

    /**
     * fetchChangelogsBeforeDate is responsible for retrieving
     * all of the change logs that were created before a given date
     * for a given Learning Object
     * @param {
     *  cuid string
     *  date string
     * }
     */
    fetchChangelogsBeforeDate(params: {
        cuid: string,
        date: string,
    }): Promise<ChangeLogDocument[]>;

    /**
     * fetchRecentChangelogsBeforeDate is responsible for retrieving
     * the newest change logs that was created before a given date
     * for a given Learning Object
     * @param {
     *  cuid string
     *  date string
     * }
     */
    fetchRecentChangelogBeforeDate(params: {
        cuid: string,
        date: string,
    }): Promise<ChangeLogDocument>;

    /**
     * deleteChangelog is responsible for deleting
     * a change log for a given Learning Object
     * @param { cuid string }
     */
    deleteChangelog(params: {
        cuid: string,
    }): Promise<void>;
}
