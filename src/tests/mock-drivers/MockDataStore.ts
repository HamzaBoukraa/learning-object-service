import {
  DataStore,
  ReleasedLearningObjectQuery,
  LearningObjectQuery,
  ParentLearningObjectQuery,
} from '../../shared/interfaces/DataStore';
import {
  LearningObjectSummary,
  ReleasedUserLearningObjectSearchQuery,
  CollectionAccessMap,
} from '../../shared/types';
import { ChangeLogDocument } from '../../shared/types/changelog';
import {
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../../LearningOutcomes/types';
import { LearningObjectStats } from '../../LearningObjectStats/LearningObjectStatsInteractor';
import {
  LearningObject,
  User,
  LearningOutcome,
  Collection,
} from '../../shared/entity';
import { Submission } from '../../LearningObjectSubmission/types/Submission';
import { SubmissionDataStore } from '../../LearningObjectSubmission/SubmissionDatastore';
import { Stubs } from '../stubs';
import { mapLearningObjectToSummary } from '../../shared/functions';
import { StubChangelogDatastore } from '../../Changelogs/testing/StubChangelogDatastore';
import { STUB_CHANGELOG_IDS } from '../../Changelogs/testing/ChangelogStubs';
import { LearningObjectUpdates } from '../../shared/types/learning-object-updates';

export class MockDataStore implements DataStore, SubmissionDataStore {
  stubs = new Stubs();
  stubChangelogDataStore = new StubChangelogDatastore();

  connect(file: string): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): void {
    return;
  }

  loadWorkingParentsReleasedChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject[]> {
    if (params.id !== this.stubs.learningObjectChild.id) {
      return Promise.resolve([this.stubs.learningObjectChild]);
    }
    return Promise.resolve([]);
  }

  searchReleasedUserObjects(
    query: ReleasedUserLearningObjectSearchQuery,
    username: string,
  ): Promise<LearningObjectSummary[]> {
    return Promise.resolve(
      [this.stubs.learningObject].map(mapLearningObjectToSummary),
    );
  }
  searchAllUserObjects(
    query: LearningObjectQuery,
    username: string,
    collectionRestrictions?: CollectionAccessMap,
  ): Promise<LearningObjectSummary[]> {
    return Promise.resolve(
      [this.stubs.learningObject].map(mapLearningObjectToSummary),
    );
  }
  findUserId(username: string): Promise<string> {
    return Promise.resolve(this.stubs.user.id);
  }

  fetchReleasedMaterials(id: string): Promise<LearningObject.Material> {
    return Promise.resolve(this.stubs.learningObject.materials);
  }

  fetchReleasedFile(params: {
    id: string;
    fileId: string;
  }): Promise<LearningObject.Material.File> {
    return Promise.resolve(this.stubs.learningObject.materials.files[0]);
  }
  fetchReleasedFiles(id: string): Promise<LearningObject.Material.File[]> {
    return Promise.resolve(this.stubs.learningObject.materials.files);
  }

  fetchLearningObjectRevision(params: {
    id: string;
    revision: number;
    author?: User,
    summary?: boolean,
  }): Promise<LearningObject | LearningObjectSummary> {
    if (params.summary) {
      return Promise.resolve(
        mapLearningObjectToSummary(this.stubs.learningObject),
      );
    }
    return Promise.resolve(
      this.stubs.learningObject,
    );
  }

  fetchLearningObjectAuthorUsername(id: string): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.author.username);
  }
  fetchParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]> {
    return Promise.resolve([]);
  }
  fetchReleasedParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]> {
    return Promise.resolve([]);
  }
  findLearningObject(params: {
    authorId: string;
    name: string;
  }): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.id);
  }
  findReleasedLearningObject(params: {
    authorId: string;
    name: string;
  }): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.id);
  }

  fetchReleasedLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject> {
    return Promise.resolve(this.stubs.learningObject as any);
  }
  loadReleasedChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject[]> {
    if (params.id !== this.stubs.learningObjectChild.id) {
      return Promise.resolve([this.stubs.learningObjectChild]);
    }
    return Promise.resolve([]);
  }

  addToReleased(object: LearningObject): Promise<void> {
    return Promise.resolve();
  }

  fetchLearningObjectStatus(id: string): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.status);
  }
  fetchLearningObjectCollection(id: string): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.collection);
  }

  async checkLearningObjectExistence(params: {
    learningObjectId: string;
    userId: string;
  }): Promise<any> {
    switch (params.learningObjectId) {
      case STUB_CHANGELOG_IDS.RELEASED_NO_REVISIONS:
        return {
          ...this.stubs.learningObject,
          status: LearningObject.Status.RELEASED,
          revision: 0,
        };
      case STUB_CHANGELOG_IDS.NOT_RELEASED:
        return {
          ...this.stubs.learningObject,
          status: LearningObject.Status.WAITING,
          revision: 0,
        };
      case STUB_CHANGELOG_IDS.MINUS_REVISION:
        return {
          ...this.stubs.learningObject,
          revision: 1,
        };
      case STUB_CHANGELOG_IDS.PLUS_REVISION:
        return {
          ...this.stubs.learningObject,
          revision: 1,
        };
      default:
        return this.stubs.learningObject;
    }
  }

  deleteChangelog(params: {
    learningObjectId: string,
  }): Promise<void> {
    return this.stubChangelogDataStore.deleteChangelog(params);
  }

  fetchAllChangelogs(params: {
    learningObjectId: string;
  }): Promise<ChangeLogDocument[]> {
   return this.stubChangelogDataStore.fetchAllChangelogs(params);
  }

  fetchChangelogsBeforeDate(params: {
    learningObjectId: string;
    date: string;
  }): Promise<ChangeLogDocument[]> {
    return this.stubChangelogDataStore.fetchChangelogsBeforeDate(params);
  }

  fetchRecentChangelogBeforeDate(params: {
    learningObjectId: string;
    date: string;
  }): Promise<ChangeLogDocument> {
    return this.stubChangelogDataStore.fetchRecentChangelogBeforeDate(params);
  }

  updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectUpdates;
  }): Promise<void> {
    return Promise.resolve();
  }
  findParentObjectIds(params: { childId: string }): Promise<string[]> {
    return Promise.resolve([]);
  }

  findChildObjectIds(params: { parentId: string }): Promise<string[]> {
    return Promise.resolve([]);
  }
  queryUserById(id: string): Promise<User> {
    return Promise.resolve(this.stubs.user);
  }

  getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    return Promise.resolve(this.stubs.learningOutcome);
  }
  getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]> {
    return Promise.resolve([]);
  }

  loadChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject[]> {
    return Promise.resolve([]);
  }
  getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material> {
    return Promise.resolve(this.stubs.learningObject.materials as any);
  }
  removeFromFiles(params: { objectId: string; fileId: string }): Promise<void> {
    return Promise.resolve();
  }
  updateFileDescription(params: {
    learningObjectId: string;
    fileId: string;
    description: string;
  }): Promise<LearningObject.Material.File> {
    return Promise.resolve(this.stubs.learningObjectFile);
  }
  findUser(username: string): Promise<string> {
    return Promise.resolve(this.stubs.user.id);
  }
  peek<T>(params: {
    query: { [index: string]: string };
    fields: { [index: string]: 0 | 1 };
  }): Promise<T> {
    return Promise.resolve({} as T);
  }
  insertLearningOutcome(params: {
    source: string;
    outcome: Partial<LearningOutcome>;
  }): Promise<string> {
    return Promise.resolve(this.stubs.learningOutcome.id);
  }
  updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome> {
    return Promise.resolve(this.stubs.learningOutcome);
  }
  deleteLearningOutcome(params: { id: string }): Promise<void> {
    return Promise.resolve();
  }
  deleteAllLearningOutcomes(params: { source: string }): Promise<void> {
    return Promise.resolve();
  }
  fetchStats(params: { query: any }): Promise<LearningObjectStats> {
    return Promise.resolve({} as any);
  }

  insertLearningObject(object: LearningObject): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.id);
  }

  reorderOutcome(id: string, outcomeID: string, index: number): Promise<void> {
    return Promise.resolve();
  }

  editLearningObject(params: {
    id: string;
    updates: LearningObjectUpdates;
  }): Promise<void> {
    return Promise.resolve();
  }

  toggleLock(id: string, lock?: LearningObject.Lock): Promise<void> {
    return Promise.resolve();
  }

  deleteLearningObject(id: string): Promise<void> {
    return Promise.resolve();
  }

  deleteMultipleLearningObjects(ids: string[]): Promise<void> {
    return Promise.resolve();
  }

  getUserObjects(username: string): Promise<string[]> {
    return Promise.resolve([this.stubs.learningObject.id]);
  }

  fetchLearningObject(params: { id: string; full?: boolean }): Promise<any> {
    switch (params.id) {
      case this.stubs.learningObject.id:
        return Promise.resolve(this.stubs.learningObject);
      case 'no_description_id':
        return Promise.resolve({
          ...this.stubs.learningObject,
          description: '',
        });
      case 'no_name_id':
        return Promise.resolve({ ...this.stubs.learningObject, name: '' });
      default:
        return Promise.resolve(this.stubs.learningObject);
    }
  }

  fetchMultipleObjects(params: {
    ids: string[];
    full?: boolean;
    status: string[];
    orderBy?: string;
    sortType?: number;
  }): Promise<any[]> {
    return Promise.resolve([this.stubs.learningObject]);
  }
  createChangelog(params: {
    learningObjectId: string;
    author: {
      userId: string;
      name: string;
      role: string;
      profileImage: string;
    };
    changelogText: string;
  }): Promise<void> {
    return Promise.resolve();
  }

  fetchRecentChangelog(params: {
    learningObjectId: string;
  }): Promise<ChangeLogDocument> {
    return Promise.resolve(this.stubs.changelog);
  }

  fetchAllObjects(params: {
    ids: string[];
    full?: boolean;
    status: string[];
    orderBy?: string;
    sortType?: number;
  }): Promise<{ objects: any[]; total: number }> {
    return Promise.resolve({
      objects: [new LearningObject(this.stubs.learningObject as any)],
      total: 1,
    });
  }

  fetchCollections(loadObjects?: boolean): Promise<Collection[]> {
    return Promise.resolve([this.stubs.collection]);
  }

  fetchCollection(name: string): Promise<Collection> {
    return Promise.resolve(this.stubs.collection);
  }

  fetchCollectionMeta(name: string): Promise<any> {
    const collectionName = this.stubs.collection.name;
    return Promise.resolve({ name: collectionName, abstracts: [''] });
  }

  fetchCollectionObjects(name: string): Promise<any[]> {
    return Promise.resolve([
      new LearningObject(this.stubs.learningObject as any),
    ]);
  }

  recordSubmission(submission: Submission): Promise<void> {
    return Promise.resolve();
  }

  fetchSubmission(
    collection: string,
    learningObjectId: string,
  ): Promise<Submission> {
    return Promise.resolve(this.stubs.submission);
  }

  recordCancellation(learningObjectId: string): Promise<void> {
    return Promise.resolve();
  }
  fetchRecentSubmission(learningObjectId: string): Promise<Submission> {
    return Promise.resolve(this.stubs.submission);
  }
  hasSubmission(params: {
    learningObjectId: string,
    collection: string,
  }): Promise<boolean> {
    return Promise.resolve(true);
  }
  unsubmitLearningObject(id: string): Promise<void> {
    return Promise.resolve();
  }

  setChildren(parentId: string, children: string[]): Promise<void> {
    return Promise.resolve();
  }

  deleteChild(parentId: string, childId: string): Promise<void> {
    return Promise.resolve();
  }

  findParentObjects(params: {
    query: ReleasedLearningObjectQuery;
  }): Promise<any[]> {
    return Promise.resolve([
      new LearningObject(this.stubs.learningObject as any),
    ]);
  }

  addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<string> {
    return Promise.resolve('');
  }

  addToCollection(learningObjectId: string, collection: string): Promise<void> {
    return Promise.resolve();
  }

  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObject.Material.File> {
    return Promise.resolve(this.stubs.learningObjectFile);
  }

  findParentObjectId(params: { childId: string }): Promise<string> {
    return Promise.resolve(this.stubs.learningObject.id);
  }
}
