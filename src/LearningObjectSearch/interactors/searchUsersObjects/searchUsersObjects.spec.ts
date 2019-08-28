import { Stubs } from '../../../tests/stubs';
import { searchUsersObjects } from './searchUsersObjects';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { UserGateway } from '../../interfaces/UserGateway';
import { UserLearningObjectDatastore } from '../../interfaces/UserLearningObjectDatastore';
import { LearningObjectSearch } from '../..';
import { LearningObjectState, ReleasedLearningObjectSearchQuery, PrivilegedLearningObjectSearchQuery, CollectionAccessMap, User, LearningObjectSearchResult } from '../../typings';
import { LearningObjectDatastore } from '../../interfaces';
import { MockUserLearningObjectDatastore } from '../../shared/tests/MockUserLearningObjectDatastore';
import { MockLearningObjectDatastore } from '../../shared/tests/MockLearningObjectDatastore';
import { MockUserGateway } from '../../shared/tests/MockUserGateway';

const stubs = new Stubs();

const INVALID_ACCESS = `Invalid access. You are not authorized to view ${stubs.user.username}'s drafts.`;
const BAD_REQUEST = 'Illegal query arguments. Cannot specify both draftsOnly and released status filters.';

const MOCK_PROVIDERS = [
    {
      provide: LearningObjectDatastore,
      useClass: MockLearningObjectDatastore,
    },
    {
      provide: UserGateway,
      useClass: MockUserGateway,
    },
    {
      provide: UserLearningObjectDatastore,
      useClass: MockUserLearningObjectDatastore,
    },
  ];

beforeAll(() => {
    LearningObjectSearch.providers = MOCK_PROVIDERS;
    LearningObjectSearch.initialize();
});

beforeEach(() => {
    jest.resetModules();
});

const nonPrivilegedUserToken = {
    username: 'RegUser',
    name: 'Reg Ular',
    email: 'standardUser@clark.center',
    organization: 'CLARK',
    emailVerified: true,
    accessGroups: ['user'],
};

const nonPrivilegedUser = new User({
    id: 'wooooo',
    username: nonPrivilegedUserToken.username,
});

const reviewerUserToken = {
    username: 'reviewerAccess',
    name: 'Revi Ewer',
    email: 'reviewer@clark.center',
    organization: 'CLARK',
    emailVerified: true,
    accessGroups: ['reviewer@nccp'],
};
const reviewer = new User({
    id: 'reviewing',
    username: reviewerUserToken.username,
});

const curatorUserToken = {
    username: 'curatorAccess',
    name: 'Cura Tor',
    email: 'curator@clark.center',
    organization: 'CLARK',
    emailVerified: true,
    accessGroups: ['curator@nccp'],
};
const curator = new User({
    id: 'rotaruc',
    username: curatorUserToken.username,
});

const editorUserToken = {
    username: 'editorAccess',
    name: 'Ed Itor',
    email: 'editor@clark.center',
    organization: 'CLARK',
    emailVerified: true,
    accessGroups: ['editor'],
};
const editor = new User({
    id: 'edit',
    username: editorUserToken.username,
});

const adminUserToken = {
    username: 'AdminUser',
    name: 'Ad Min',
    email: 'admin@clark.center',
    organization: 'CLARK',
    emailVerified: true,
    accessGroups: ['admin'],
};
const admin = new User({
    id: 'somethingsimple',
    username: adminUserToken.username,
});

const isAuthorDraftsOnlyQuery = {
    revision: 0,
    status: [
        ...LearningObjectState.UNRELEASED,
        ...LearningObjectState.IN_REVIEW,
    ],
};

const isPrivilegedDraftsOnlyQuery = {
    revision: 0,
    status: LearningObjectState.IN_REVIEW,
};

const nonPrivilegedQuery = {};

const isCuratorOrReviewerQuery = {
    status: LearningObjectState.RELEASED,
};

const collectionAccessDenied = {
    nccp: ['released'],
};

const collectionAccess = {
    nccp: ['waiting', 'review', 'proofing', 'released'],
};

const isAdminOrEditorSearchReleasedQuery = {
    status: LearningObjectState.RELEASED,
};

const isAdminOrEditorQuery = {
    status: [
        ...LearningObjectState.IN_REVIEW,
        ...LearningObjectState.RELEASED,
    ],
};

class MockUserGatewayAdmin implements UserGateway {
    getUser(username: string): Promise<User> {
        return Promise.resolve(admin);
    }
}
describe('If draftsOnly is specified', () => {
    describe('and the requester is not the author and is not a priveleged user', () => {
        it('should throw an error', async () => {
            const promise = searchUsersObjects({
                authorUsername: stubs.user.username,
                requester: nonPrivilegedUserToken,
                query: { draftsOnly: true },
            });
            expect(promise).rejects.toEqual(new ResourceError(INVALID_ACCESS, ResourceErrorReason.INVALID_ACCESS));
        });
    });
    describe('and the requester does not specify status', () => {
        beforeAll(() => {
            LearningObjectSearch.destroy();
            LearningObjectSearch.providers = [
                ...MOCK_PROVIDERS,
                { provide: UserGateway, useClass: MockUserGatewayAdmin },
              ];
            LearningObjectSearch.initialize();
        });
        describe('and the requester is the author', () => {
            it('should return Learning Objects that belong to the author and has any status except released', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: admin.username,
                    requester: adminUserToken,
                    query: { draftsOnly: true },
                });
                expect(spy).toBeCalledWith(isAuthorDraftsOnlyQuery, admin.id, undefined);
            });
        });
        describe('and the requester is not the author, but is a privileged user', () => {
            it('should return Learning Objects that belong to the author and are in review.', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: adminUserToken,
                    query: { draftsOnly: true },
                });
                expect(spy).toBeCalledWith(isPrivilegedDraftsOnlyQuery, admin.id, undefined);
            });
        });
    });
    describe('and the status is set to released', () => {
        it('should throw an error.', () => {
            const p = searchUsersObjects({
                authorUsername: stubs.user.username,
                requester: stubs.userToken,
                query: { draftsOnly: true, status: LearningObjectState.RELEASED },
            });
            expect(p).rejects.toEqual(new ResourceError(BAD_REQUEST, ResourceErrorReason.BAD_REQUEST));
        });
    });
});
describe('If draftsOnly is not specified', () => {
    describe('and the requester is not the author and is not a priveleged user', () => {
        class MockUserGatewayNonPrivilege implements UserGateway {
            getUser(username: string): Promise<User> {
                return Promise.resolve(nonPrivilegedUser);
            }
        }
        beforeAll(() => {
            LearningObjectSearch.destroy();
            LearningObjectSearch.providers = [
                ...MOCK_PROVIDERS,
                { provide: UserGateway, useClass: MockUserGatewayNonPrivilege },
              ];
            LearningObjectSearch.initialize();
        });
        it('should return Learning Objects that belong to the author and are released', async () => {
            const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
            const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchReleasedUserObjects');
            await searchUsersObjects({
                authorUsername: stubs.user.username,
                requester: nonPrivilegedUserToken,
                query: { draftsOnly: false },
            });
            expect(spy).toBeCalledWith(nonPrivilegedQuery, nonPrivilegedUser.id);
            });
        });
    describe('and the requester is not the author and is a privileged user', () => {
        describe('and the user has a privilege of reviewer@nccp', () => {
            class MockUserGatewayReviewer implements UserGateway {
                getUser(username: string): Promise<User> {
                    return Promise.resolve(reviewer);
                }
            }
            beforeAll(() => {
                LearningObjectSearch.destroy();
                LearningObjectSearch.providers = [
                    ...MOCK_PROVIDERS,
                    { provide: UserGateway, useClass: MockUserGatewayReviewer },
                  ];
                LearningObjectSearch.initialize();
            });
            it('should return Learning Objects that belong to the author and a status of released', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: reviewerUserToken,
                    query: { draftsOnly: false, status: LearningObjectState.RELEASED },
                });
                expect(spy).toBeCalledWith(isCuratorOrReviewerQuery, reviewer.id, collectionAccessDenied );
                });
            it('should return Learning Objects that belong to the author that were submitted to the reviewer`s collection', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: reviewerUserToken,
                    query: { draftsOnly: false },
                });
                expect(spy).toBeCalledWith(isCuratorOrReviewerQuery, reviewer.id, collectionAccess);
                });
            });
        describe('and the user has a privilege of curator@nccp', () => {
            class MockUserGatewayCurator implements UserGateway {
                getUser(username: string): Promise<User> {
                    return Promise.resolve(curator);
                }
            }
            beforeAll(() => {
                LearningObjectSearch.destroy();
                LearningObjectSearch.providers = [
                    ...MOCK_PROVIDERS,
                    { provide: UserGateway, useClass: MockUserGatewayCurator },
                  ];
                LearningObjectSearch.initialize();
            });
            it('should return Learning Objects that belong to the author and a status of released', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: curatorUserToken,
                    query: { draftsOnly: false, status: LearningObjectState.RELEASED },
                });
                expect(spy).toBeCalledWith(isCuratorOrReviewerQuery, curator.id, collectionAccessDenied);
            });
            it('should return Learning Objects that belong to the author that were submitted to the curator`s collection', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: curatorUserToken,
                    query: { draftsOnly: false },
                });
                expect(spy).toBeCalledWith(isCuratorOrReviewerQuery, curator.id, collectionAccess);
            });
        });
        describe('and the user has a privilege of editor', () => {
            class MockUserGatewayEditor implements UserGateway {
                getUser(username: string): Promise<User> {
                    return Promise.resolve(editor);
                }
            }
            beforeAll(() => {
                LearningObjectSearch.destroy();
                LearningObjectSearch.providers = [
                    ...MOCK_PROVIDERS,
                    { provide: UserGateway, useClass: MockUserGatewayEditor },
                  ];
                LearningObjectSearch.initialize();
            });
            it('should return Learning Objects that belong to the author and a status of released', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: editorUserToken,
                    query: { draftsOnly: false, status: LearningObjectState.RELEASED },
                });
                expect(spy).toBeCalledWith(isAdminOrEditorSearchReleasedQuery, editor.id, undefined);
            });
            it('should return Learning Objects that belong to the author that were submitted to any collection', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: editorUserToken,
                    query: { draftsOnly: false },
                });
                expect(spy).toBeCalledWith(isAdminOrEditorQuery, editor.id, undefined);
            });
        });
        describe('and the user has a privilege of admin', () => {
            beforeAll(() => {
                LearningObjectSearch.destroy();
                LearningObjectSearch.providers = [
                    ...MOCK_PROVIDERS,
                    { provide: UserGateway, useClass: MockUserGatewayAdmin },
                  ];
                LearningObjectSearch.initialize();
            });
            it('should return Learning Objects that belong to the author and a status of released', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: adminUserToken,
                    query: { draftsOnly: false, status: LearningObjectState.RELEASED },
                });
                expect(spy).toBeCalledWith(isAdminOrEditorSearchReleasedQuery, admin.id, undefined);
            });
            it('should return Learning Objects that belong to the author that were submitted to any collection', async () => {
                const mockUserLearningObjectDatastore = LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
                const spy = jest.spyOn(mockUserLearningObjectDatastore, 'searchAllUserObjects');
                await searchUsersObjects({
                    authorUsername: stubs.user.username,
                    requester: adminUserToken,
                    query: { draftsOnly: false },
                });
                expect(spy).toBeCalledWith(isAdminOrEditorQuery, admin.id, undefined);
            });
        });
   });
});
