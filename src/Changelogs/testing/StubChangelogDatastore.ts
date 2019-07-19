import { ChangelogDataStore } from '../interfaces/ChangelogDataStore';
import { ChangeLogDocument } from '../../shared/types/changelog';
import { Stubs } from '../../tests/stubs';
import { STUB_CHANGELOG_IDS } from './ChangelogStubs';

const stubs = new Stubs();

export class StubChangelogDatastore implements ChangelogDataStore {
    createChangelog(params: {
        learningObjectId: string;
        author: {
            userId: string;
            name: string;
            role: string;
            profileImage: string;
        },
        changelogText: string;
    }): Promise<void> {
        return Promise.resolve();
    }

    async getRecentChangelog(params: {
        learningObjectId: string;
    }): Promise<ChangeLogDocument> {
        switch (params.learningObjectId) {
            case STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS,
                };
            case STUB_CHANGELOG_IDS.NOT_RELEASED:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.NOT_RELEASED,
                };
            case STUB_CHANGELOG_IDS.MINUS_REVISION:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.MINUS_REVISION,
                };
            case STUB_CHANGELOG_IDS.PLUS_REVISION:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.PLUS_REVISION,
                };
            default:
                return stubs.changelog;
        }
    }

    async fetchAllChangelogs(params: {
        learningObjectId: string;
    }): Promise<ChangeLogDocument[]> {
        switch (params.learningObjectId) {
            case STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS,
                }];
            case STUB_CHANGELOG_IDS.NOT_RELEASED:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.NOT_RELEASED,
                }];
            case STUB_CHANGELOG_IDS.MINUS_REVISION:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.MINUS_REVISION,
                }];
            case STUB_CHANGELOG_IDS.PLUS_REVISION:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.PLUS_REVISION,
                }];
            default:
                return [stubs.changelog];
        }
    }

    async fetchChangelogsBeforeDate(params: {
        learningObjectId: string;
        date: string;
    }): Promise<ChangeLogDocument[]> {
        switch (params.learningObjectId) {
            case STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS,
                }];
            case STUB_CHANGELOG_IDS.NOT_RELEASED:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.NOT_RELEASED,
                }];
            case STUB_CHANGELOG_IDS.MINUS_REVISION:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.MINUS_REVISION,
                }];
            case STUB_CHANGELOG_IDS.PLUS_REVISION:
                return [{
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.PLUS_REVISION,
                }];
            default:
                return [stubs.changelog];
        }
    }

    async fetchRecentChangelogBeforeDate(params: {
        learningObjectId: string;
        date: string;
    }): Promise<ChangeLogDocument> {
        switch (params.learningObjectId) {
            case STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS,
                };
            case STUB_CHANGELOG_IDS.NOT_RELEASED:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.NOT_RELEASED,
                };
            case STUB_CHANGELOG_IDS.MINUS_REVISION:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.MINUS_REVISION,
                };
            case STUB_CHANGELOG_IDS.PLUS_REVISION:
                return {
                    ...stubs.changelog,
                    learningObjectId: STUB_CHANGELOG_IDS.PLUS_REVISION,
                };
            default:
                return stubs.changelog;
        }
    }

    deleteChangelog(params: {
        learningObjectId: string;
    }): Promise<void> {
        return Promise.resolve();
    }
}
