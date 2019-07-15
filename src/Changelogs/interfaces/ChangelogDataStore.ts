import { ChangeLogDocument } from '../../shared/types/changelog';

export interface ChangelogDataStore {
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

    getRecentChangelog(params: {
        learningObjectId: string,
    }): Promise<ChangeLogDocument>;

    fetchAllChangelogs(params: {
        learningObjectId: string,
    }): Promise<ChangeLogDocument[]>;

    fetchChangelogsBeforeDate(params: {
        learningObjectId: string,
        date: string,
    }): Promise<ChangeLogDocument[]>;

    fetchRecentChangelogBeforeDate(params: {
        learningObjectId: string,
        date: string,
    }): Promise<ChangeLogDocument>;

    deleteChangelog(params: {
        learningObjectId: string,
    }): Promise<void>;
}
