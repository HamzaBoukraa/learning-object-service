import { MongoClient, Db, ObjectID, Cursor } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import {
  LearningObject,
  LearningOutcome,
  User,
  AcademicLevel,
  Outcome,
} from '@cyber4all/clark-entity';
import {
  LearningObjectDocument,
  LearningOutcomeDocument,
  UserDocument,
  StandardOutcomeDocument,
} from '@cyber4all/clark-schema';
import {
  LearningObjectCollection,
  LearningObjectQuery,
  Filters,
} from '../interfaces/DataStore';
import {
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  CompletedPart,
} from '../interfaces/FileManager';
import {
  LearningObjectLock,
  Restriction,
  Material
} from '@cyber4all/clark-entity/dist/learning-object';
import { LearningObjectFile } from '../interactors/LearningObjectInteractor';
import { reportError } from './SentryConnector';
import * as ObjectMapper from './Mongo/ObjectMapper';
import { SubmissionDatastore } from '../LearningObjectSubmission/SubmissionDatastore';

export interface Collection {
  name: string;
  foreigns?: Foreign[];
  uniques?: string[];
  text?: string[];
}
export interface Foreign {
  name: string;
  data: ForeignData;
}

export interface ForeignData {
  target: string;
  child: boolean;
  registry?: string;
}
export class COLLECTIONS {
  public static User: Collection = {
    name: 'users',
    foreigns: [
      {
        name: 'objects',
        data: {
          target: 'LearningObject',
          child: true,
        },
      },
    ],
    uniques: ['username'],
  };
  public static LearningObject: Collection = {
    name: 'objects',
    foreigns: [
      {
        name: 'authorID',
        data: {
          target: 'User',
          child: false,
          registry: 'objects',
        },
      },
      {
        name: 'outcomes',
        data: {
          target: 'LearningOutcome',
          child: true,
          registry: 'source',
        },
      },
    ],
  };
  public static LearningOutcome: Collection = {
    name: 'learning-outcomes',
    foreigns: [
      {
        name: 'source',
        data: {
          target: 'LearningObject',
          child: false,
          registry: 'outcomes',
        },
      },
    ],
  };
  public static StandardOutcome: Collection = { name: 'outcomes' };
  public static LearningObjectCollection: Collection = { name: 'collections' };
  public static MultipartUploadStatusCollection: Collection = {
    name: 'multipart-upload-statuses',
  };
}

const COLLECTIONS_MAP = new Map<string, Collection>();
COLLECTIONS_MAP.set('User', COLLECTIONS.User);
COLLECTIONS_MAP.set('LearningObject', COLLECTIONS.LearningObject);
COLLECTIONS_MAP.set('LearningOutcome', COLLECTIONS.LearningOutcome);
COLLECTIONS_MAP.set('StandardOutcome', COLLECTIONS.StandardOutcome);
COLLECTIONS_MAP.set(
  'LearningObjectCollection',
  COLLECTIONS.LearningObjectCollection,
);
COLLECTIONS_MAP.set(
  'MultipartUploadStatusCollection',
  COLLECTIONS.MultipartUploadStatusCollection,
);

export class MongoDriver implements DataStore {
  submissionStore: SubmissionDatastore;
  togglePublished(username: string, id: string, published: boolean): Promise<void> {
    return this.submissionStore.togglePublished(username, id, published);
  }
  private mongoClient: MongoClient;
  private db: Db;

  constructor(dburi: string) {
    this.connect(dburi).then(() => this.submissionStore = new SubmissionDatastore(this.db));
  }

  /**
   * Connect to the database. Must be called before any other functions.
   * @async
   *
   * NOTE: This function will attempt to connect to the database every
   *       time it is called, but since it assigns the result to a local
   *       variable which can only ever be created once, only one
   *       connection will ever be active at a time.
   *
   * TODO: Verify that connections are automatically closed
   *       when they no longer have a reference.
   *
   * @param {string} dbIP the host and port on which mongodb is running
   */
  async connect(dbURI: string, retryAttempt?: number): Promise<void> {
    try {
      this.mongoClient = await MongoClient.connect(dbURI);
      this.db = this.mongoClient.db();
    } catch (e) {
      if (!retryAttempt) {
        this.connect(
          dbURI,
          1,
        );
      } else {
        return Promise.reject(
          'Problem connecting to database at ' + dbURI + ':\n\t' + e,
        );
      }
    }
  }
  /**
   * Close the database. Note that this will affect all services
   * and scripts using the database, so only do this if it's very
   * important or if you are sure that *everything* is finished.
   */
  disconnect(): void {
    this.mongoClient.close();
  }
  /////////////
  // INSERTS //
  /////////////

  /**
   * Insert a learning object into the database.
   * @async
   *
   * @param {LearningObjectInsert} object
   *
   * @returns {LearningObjectID} the database id of the new record
   */
  async insertLearningObject(object: LearningObject): Promise<string> {
    try {
      // FIXME: This should be scoped to Interactor
      const authorID = await this.findUser(object.author.username);
      const author = await this.fetchUser(authorID);
      if (!author.emailVerified) {
        object.unpublish();
      }

      object.lock = {
        restrictions: [
          Restriction.DOWNLOAD,
        ],
      };
      const doc = await this.documentLearningObject(object, true);
      // FIXME: WHY?? ID Is inserted in document LearningObject function
      const id = await this.insert(COLLECTIONS.LearningObject, doc);

      await this.insertLearningOutcomes(
        {
          learningObjectID: id,
          learningObjectName: object.name,
          authorName: author.name,
        },
        object.outcomes,
      );
      // FIXME: ID is wrong
      return id;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Updates or inserts LearningObjectFile into learning object's files array
   *
   * @param {{
   *     id: string;
   *     loFile: LearningObjectFile;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  public async addToFiles(params: {
    id: string;
    loFile: LearningObjectFile;
  }): Promise<void> {
    try {
      const existingDoc = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOneAndUpdate(
          { _id: params.id, 'materials.files.url': params.loFile.url },
          { $set: { 'materials.files.$[element]': params.loFile } },
          // @ts-ignore: arrayFilters is in fact a property defined by documentation. Property does not exist in type definition.
          { arrayFilters: [{ 'element.url': params.loFile.url }] },
        );
      if (!existingDoc.value) {
        await this.db.collection(COLLECTIONS.LearningObject.name).updateOne(
          {
            _id: params.id,
          },
          { $push: { 'materials.files': params.loFile } },
        );
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(
          COLLECTIONS.MultipartUploadStatusCollection.name,
        )
        .insertOne(params.status);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus> {
    try {
      const status = await this.db
        .collection<MultipartFileUploadStatus>(
          COLLECTIONS.MultipartUploadStatusCollection.name,
        )
        .findOne({ _id: params.id });
      return status;
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async updateMultipartUploadStatus(params: {
    id: string;
    updates: MultipartFileUploadStatusUpdates;
    completedPart: CompletedPart;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(
          COLLECTIONS.MultipartUploadStatusCollection.name,
        ) 
        .updateOne(
          { _id: params.id },
          {
            $set: params.updates,
            $push: { completedParts: params.completedPart },
          },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async deleteMultipartUploadStatus(params: {
    id: string;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(
          COLLECTIONS.MultipartUploadStatusCollection.name,
        )
        .deleteOne({ _id: params.id });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Inserts a child id into a learning object's children array if the child object
   * exists in the LearningObject collection.
   *
   * @async
   * @param {string} parentId The database ID of the parent Learning Object
   * @param {string} childId The database ID of the child Learning Object
   * @memberof MongoDriver
   */
  async setChildren(parentId: string, children: string[]): Promise<any> {
    try {
      const collection = this.db.collection(COLLECTIONS.LearningObject.name);

      const parentObject = await collection.findOne({ _id: parentId });
      const childrenObjects = await collection
        .find({ _id: { $in: children } })
        .toArray();

      // check that the same number of children objects were returned as ids were sent
      if (childrenObjects.length !== children.length) {
        return Promise.reject({
          message: `One or more of the children id's does not exist`,
          status: 404,
        });
      } else {
        if (!this.checkChildrenLength(parentObject, childrenObjects)) {
          // at least one of the children is of an equal or greater length than the parent
          return Promise.reject({
            message: `One or more of the children objects are of a length greater than or equal to the parent objects length`,
            status: 400,
          });
        }

        parentObject.children = children;

        // replace children array of parent with passed children array
        await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .findOneAndUpdate(
            { _id: parentId },
            { $set: { children } },
            { upsert: true },
          );
      }
    } catch (error) {
      console.log(error);
      return Promise.reject({
        message: `Problem inserting children into Object ${parentId}`,
        status: 500,
      });
    }
  }

  /**
   * Iterates the provided array of children objects and ensure that none of them are of an equal or greater length than the parent
   * @param {LearningObject} parent Learning object to which children will be added
   * @param {LearningObject[]} children Array of learning objects to be added as children to parent
   */
  private checkChildrenLength(
    parent: LearningObject,
    children: LearningObject[],
  ): boolean {
    // FIXME: These lengths should be retrieved from a standardized source such as a npm module
    const lengths = ['nanomodule', 'micromodule', 'module', 'unit', 'course'];
    const maxLengthIndex = lengths.indexOf(parent.length);

    for (let i = 0, l = children.length; i < l; i++) {
      if (lengths.indexOf(children[i].length) >= maxLengthIndex) {
        // this learning object is of an equal or greater length than the parent
        return false;
      }
    }

    return true;
  }

  /**
   * deletes a child id from a learning object's children array if the child object
   * exists in the children array.
   *
   * @async
   * @param {string} parentId The database ID of the parent Learning Object
   * @param {string} childId The database ID of the child Learning Object
   * @memberof MongoDriver
   */
  async deleteChild(parentId: string, childId: string) {
    try {
      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .update({ _id: parentId }, { $pull: { children: childId } })
        .then(res => {
          return res.result.nModified > 0
            ? Promise.resolve()
            : Promise.reject({
                message: `${childId} is not a child of Object ${parentId}`,
                status: 404,
              });
        });
    } catch (error) {
      if (error.message && error.status) {
        return Promise.reject(error);
      }
      return Promise.reject({
        message: `Problem removing child ${childId} from Object ${parentId}`,
        status: 400,
      });
    }
  }

  /**
   * Finds Parents of requested Object
   *
   * @param {{
   *     query: LearningObjectQuery;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    try {
      let cursor: Cursor<LearningObjectDocument> = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>({ children: params.query.id });
      cursor = this.applyCursorFilters<LearningObjectDocument>(
        cursor,
        params.query,
      );
      const parentDocs = await cursor.toArray();
      const parents = await this.bulkGenerateLearningObjects(
        parentDocs,
        params.query.full,
      );
      return parents;
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Insert a learning outcome into the database.
   * @async
   *
   * @param {LearningOutcomeInsert} record
   *
   * @returns {LearningOutcomeID} the database id of the new record
   */
  private async insertLearningOutcomes(
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
    outcomes: LearningOutcome[],
  ): Promise<void> {
    try {
      await Promise.all(
        outcomes.map(async outcome => {
          const doc = this.documentLearningOutcome(outcome, source, true);
          return this.insert(COLLECTIONS.LearningOutcome, doc);
        }),
      );
    } catch (e) {
      return Promise.reject('Problem inserting Learning Outcomes:\n\t' + e);
    }
  }

  ////////////////////////////
  // MAPPING AND REGISTRIES //
  ////////////////////////////

  /**
   * Add a mapping for an outcome.
   * @async
   *
   * @param {OutcomeID} outcome the user's outcome
   * @param {OutcomeID} mapping the newly associated outcome's id
   */
  async mapOutcome(outcome: string, mapping: string): Promise<void> {
    /*
         * TODO: alter register (and others) to take schema, not collection
         *       perform validation in register (code is already written in comment down there)
         */
    // validate mapping, since it can't (currently) happen in generic register function
    // NOTE: this is a temporary fix. Do TODO above!
    const target = await this.db
      .collection('outcomes')
      .findOne({ _id: mapping });
    if (!target)
      return Promise.reject(
        'Registration failed: no mapping ' + mapping + 'found in outcomes',
      );
    return this.register(
      COLLECTIONS.LearningOutcome,
      outcome,
      'mappings',
      mapping,
    );
  }

  /**
   * Undo a mapping for an outcome.
   * @async
   *
   * @param {OutcomeID} outcome the user's outcome
   * @param {OutcomeID} mapping the newly associated outcome's id
   */
  async unmapOutcome(outcome: string, mapping: string): Promise<void> {
    return this.unregister(
      COLLECTIONS.LearningOutcome,
      outcome,
      'mappings',
      mapping,
    );
  }

  /**
   * Reorder an outcome in an object's outcomes list.
   * @async
   *
   * @param {LearningObjectID} object the object
   * @param {LearningOutcomeID} outcome the outcome being reordered
   * @param {number} index the new index for the outcome
   */
  async reorderOutcome(
    object: string,
    outcome: string,
    index: number,
  ): Promise<void> {
    return this.reorder(
      COLLECTIONS.LearningObject,
      object,
      'outcomes',
      outcome,
      index,
    );
  }

  ///////////////////////////////////////////////////////////////////
  // EDITS - update without touching any foreign keys or documents //
  ///////////////////////////////////////////////////////////////////

  /**
   * Edit a learning object.
   * @async
   *
   * @param {LearningObjectID} id which document to change
   * @param {LearningObjectEdit} record the values to change to
   */
  async editLearningObject(id: string, object: LearningObject): Promise<void> {
    try {
      const old = await this.fetch<LearningObjectDocument>(
        COLLECTIONS.LearningObject,
        id,
      );
      const author = await this.fetchUser(old.authorID);
      if (!author.emailVerified) {
        object.unpublish();
      }

      const doc = await this.documentLearningObject(object, false, id);
      // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
      await this.edit(COLLECTIONS.LearningObject, id, doc);

      const outcomesToAdd: LearningOutcome[] = [];
      const oldOutcomes: Set<string> = new Set(old.outcomes);

      await Promise.all(
        object.outcomes.map(async outcome => {
          try {
            // Check if outcome already exists
            const outcomeID = await this.findLearningOutcome(id, outcome.tag);
            // Remove from array of outcomes
            oldOutcomes.delete(outcomeID);
            // Edit Learning Outcome
            await this.editLearningOutcome(outcomeID, outcome, {
              learningObjectID: id,
              learningObjectName: doc.name,
              authorName: object.author.name,
            });
          } catch (e) {
            outcomesToAdd.push(outcome);
          }
        }),
      );

      // Insert new Learning Outcomes
      if (outcomesToAdd.length) {
        await this.insertLearningOutcomes(
          {
            learningObjectID: id,
            learningObjectName: doc.name,
            authorName: object.author.name,
          },
          outcomesToAdd,
        );
      }

      // Remove deleted outcomes
      const staleOutcomes = Array.from(oldOutcomes);

      await Promise.all(
        staleOutcomes.map((outcomeID: string) => {
          return this.remove(COLLECTIONS.LearningOutcome, outcomeID);
        }),
      );

      // ensure all outcomes have the right name_ and date tag
      await this.db.collection(COLLECTIONS.LearningOutcome.name).updateMany(
        { source: id },
        {
          $set: {
            name: object.name,
            date: object.date,
          },
        },
      );

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async toggleLock(
    id: string,
    lock?: LearningObjectLock,
  ): Promise<void> {
    try {
      const updates: any = {
        lock,
      };

      if (
        lock &&
        (lock.restrictions.indexOf(Restriction.FULL) > -1 ||
          lock.restrictions.indexOf(Restriction.PUBLISH) > -1)
      ) {
        updates.published = false;
      }

      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .update(
          { _id: id },
          lock ? { $set: updates } : { $unset: { lock: null } },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Edit a learning outcome.
   * @async
   *
   * @param {LearningOutcomeID} id which document to change
   * @param {LearningOutcomeEdit} record the values to change to
   */
  private async editLearningOutcome(
    id: string,
    outcome: LearningOutcome,
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
  ): Promise<void> {
    const doc: LearningOutcomeDocument = await this.documentLearningOutcome(
      outcome,
      source,
    );
    return this.edit(COLLECTIONS.LearningOutcome, id, doc);
  }

  //////////////////////////////////////////
  // DELETIONS - will cascade to children //
  //////////////////////////////////////////

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteLearningObject(id: string): Promise<void> {
    try {
      // remove children references to this learning object from parent
      await this.deleteLearningObjectParentReferences(id);

      // now remove the object
      return await this.remove(COLLECTIONS.LearningObject, id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteMultipleLearningObjects(ids: string[]): Promise<any> {
    // now remove objects from database
    return Promise.all(
      ids.map(async id => {
        // remove children references to this learning object from parent
        await this.deleteLearningObjectParentReferences(id);

        // now remove the object
        return this.remove(COLLECTIONS.LearningObject, id);
      }),
    );
  }

  /**
   * Iterates a user's learning objects and removes children references to the specified id
   * @param id represents the learning object whose references are to be removed
   */
  private async deleteLearningObjectParentReferences(id: string): Promise<any> {
    // remove references to learning object from parents
    return await this.db
      .collection(COLLECTIONS.LearningObject.name)
      .findOneAndUpdate({ children: id }, { $pull: { children: id } });
  }

  /**
   * Remove a learning outcome from the database.
   * @async
   *
   * @param {LearningOutcomeID} id which document to delete
   */
  private async deleteLearningOutcome(id: string): Promise<void> {
    try {
      // find any outcomes mapping to this one, and unmap them
      //  this data assurance step is in the general category of
      //  'any other foreign keys pointing to this collection and id'
      //  which is excessive enough to justify this specific solution
      await this.db
        .collection(COLLECTIONS.LearningOutcome.name)
        .updateMany({ mappings: id }, { $pull: { $mappings: id } });
      // remove this outcome
      return this.remove(COLLECTIONS.LearningOutcome, id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  ///////////////////////////
  // INFORMATION RETRIEVAL //
  ///////////////////////////

  /**
   * Get LearningObject IDs owned by User
   *
   * @param {string} username
   * @returns {string[]}
   * @memberof MongoDriver
   */
  async getUserObjects(username: string): Promise<string[]> {
    try {
      const id = await this.findUser(username);
      const user = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>({ _id: id });
      return user.objects;
    } catch (e) {
      return Promise.reject(`Problem fetch User's Objects. Error: ${e}`);
    }
  }

  /**
   * Look up a user by its login id.
   * @async
   *
   * @param {string} id the user's login id
   *
   * @returns {UserID}
   */
  async findUser(username: string): Promise<string> {
    try {
      const query = {};
      if (isEmail(username)) {
        query['email'] = username;
      } else {
        query['username'] = username;
      }
      const userRecord = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>(query);
      if (!userRecord)
        return Promise.reject(
          'No user with username or email' + username + ' exists.',
        );
      return `${userRecord._id}`;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Look up a learning object by its author and name.
   * @async
   *
   * @param {UserID} author the author's unique database id
   * @param {string} name the object's name
   *
   * @returns {LearningObjectID}
   */
  async findLearningObject(username: string, name: string): Promise<string> {
    try {
      const authorID = await this.findUser(username);
      const doc = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne<LearningObjectDocument>({
          authorID: authorID,
          name: name,
        });
      if (!doc)
        return Promise.reject(
          'No learning object ' + name + ' for the given user',
        );
      return Promise.resolve(doc._id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Look up a learning outcome by its source and tag.
   * @async
   *
   * @param {LearningObjectID} source the object source's unique database id
   * @param {number} tag the outcome's unique identifier
   *
   * @returns {LearningOutcomeID}
   */
  private async findLearningOutcome(
    source: string,
    tag: number,
  ): Promise<string> {
    try {
      const doc = await this.db
        .collection(COLLECTIONS.LearningOutcome.name)
        .findOne<LearningOutcomeDocument>({
          source: source,
          tag: tag,
        });
      if (!doc)
        return Promise.reject(
          'No learning outcome ' + tag + ' for the given learning object',
        );
      return Promise.resolve(doc._id);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Look up a standard outcome by its tag.
   * @async
   *
   * @param {string} tag the outcome's unique identifier
   *
   * @returns {StandardOutcomeID}
   */
  async findMappingID(
    date: string,
    name: string,
    outcome: string,
  ): Promise<string> {
    try {
      const tag = date + '$' + name + '$' + outcome;
      const doc = await this.db
        .collection(COLLECTIONS.StandardOutcome.name)
        .findOne<StandardOutcomeDocument>({
          tag: tag,
        });
      if (!doc)
        return Promise.reject(
          'No mappings found with tag: ' + tag + ' in the database',
        );
      return Promise.resolve(doc._id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the user document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {UserRecord}
   */
  async fetchUser(id: string): Promise<User> {
    try {
      const doc = await this.fetch<UserDocument>(COLLECTIONS.User, id);
      const user = ObjectMapper.generateUser(doc);
      return user;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the learning object document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningObjectRecord}
   */
  async fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    const object = await this.fetch<LearningObjectDocument>(
      COLLECTIONS.LearningObject,
      id,
    );
    const author = await this.fetchUser(object.authorID);

    const learningObject = await this.generateLearningObject(
      author,
      object,
      full,
    );
    if (!accessUnpublished && !learningObject.published)
      return Promise.reject(
        'User does not have access to the requested resource.',
      );
    return learningObject;
  }

  /**
   * Fetch the learning outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningOutcomeRecord}
   */
  private async fetchLearningOutcome(id: string): Promise<LearningOutcome> {
    try {
      const record = await this.fetch<LearningOutcomeDocument>(
        COLLECTIONS.LearningOutcome,
        id,
      );
      const outcome = await this.generateLearningOutcome(record);
      return outcome;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the generic outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {OutcomeRecord}
   */
  private async fetchOutcome(id: string): Promise<Outcome> {
    try {
      const record = await this.fetch<StandardOutcomeDocument>(
        COLLECTIONS.StandardOutcome,
        id,
      );
      const outcome = await this.generateStandardOutcome(record);
      return outcome;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {Cursor<LearningObjectRecord>[]} cursor of literally all objects
   */
  async fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const query: any = {};

      if (!accessUnpublished) {
        query.published = true;
      }

      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query);
      const totalRecords = await objectCursor.count();
      objectCursor = this.applyCursorFilters(objectCursor, { page, limit });

      const docs = await objectCursor.toArray();
      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
      );
      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject(`Error fetching all learning objects. Error: ${e}`);
    }
  }

  /**
   * Converts array of LearningObjectDocuments to Learning Objects
   *
   * @private
   * @param {LearningObjectDocument[]} docs
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  private async bulkGenerateLearningObjects(
    docs: LearningObjectDocument[],
    full?: boolean,
  ): Promise<LearningObject[]> {
    return await Promise.all(
      docs.map(async doc => {
        const author = await this.fetchUser(doc.authorID);
        const learningObject = await this.generateLearningObject(
          author,
          doc,
          full,
        );
        learningObject.id = doc._id;
        return learningObject;
      }),
    );
  }

  /**
   * Fetches the learning object documents associated with the given ids.
   *
   * @param ids array of database ids
   *
   * @returns {Cursor<LearningObjectRecord>[]}
   */
  async fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: 1 | -1,
  ): Promise<LearningObject[]> {
    try {
      const query: any = { _id: { $in: ids } };
      if (!accessUnpublished) query.published = true;
      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query);

      objectCursor = this.applyCursorFilters(objectCursor, {
        orderBy,
        sortType,
      });

      const docs = await objectCursor.toArray();

      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        full,
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects: ${ids}. Error: ${e}`,
      );
    }
  }

  /* Search for objects on CuBE criteria.
    *
    * TODO: Efficiency very questionable.
    *      Convert to streaming algorithm if possible.
    *
    * TODO: behavior is currently very strict (ex. name, author must exactly match)
    *       Consider text-indexing these fields to exploit mongo $text querying.
    */
  // tslint:disable-next-line:member-ordering
  async searchObjects(params: {
      name: string,
      author: string,
      collection: string,
      status: string[],
      length: string[],
      level: string[],
      standardOutcomeIDs: string[],
      text: string,
      accessUnpublished?: boolean,
      orderBy?: string,
      sortType?: 1 | -1,
      page?: number,
      limit?: number,
      released?: boolean,
    },
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      // Query for users
      const authorRecords: {
        _id: string;
        username: string;
      }[] = await this.matchUsers(params.author, params.text);

      const exactAuthor =
        params.author && authorRecords && authorRecords.length ? true : false;

      // Query by LearningOutcomes' mappings
      let outcomeIDs;
      if (params.standardOutcomeIDs) {
        const outcomeRecords: LearningOutcomeDocument[] = await this.matchOutcomes(
          params.standardOutcomeIDs,
        );
        outcomeIDs =  outcomeRecords
          ? outcomeRecords.map(doc => doc._id)
          : null;
      }

      let query: any = this.buildSearchQuery(
        params.accessUnpublished,
        params.text,
        authorRecords,
        params.status,
        params.length,
        params.level,
        outcomeIDs,
        params.name,
        params.collection,
        exactAuthor,
        params.released,
      );

      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query)
        .project({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });

      const totalRecords = await objectCursor.count();

      if (typeof params.sortType === 'string') {
        // @ts-ignore
        sortType = parseInt(sortType, 10) || 1;
      }

      // Paginate if has limiter
      objectCursor = this.applyCursorFilters(objectCursor, {
        page: params.page,
        limit: params.limit,
        orderBy: params.orderBy,
        sortType: params.sortType,
      });

      const docs = await objectCursor.toArray();

      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        false,
      );

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject('Error suggesting objects' + e);
    }
  }

  async findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    try {
      const fileMetaData = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne(
          {
            _id: params.learningObjectId,
            'materials.files': {
              $elemMatch: { id: params.fileId },
            },
          },
          {
            _id: 0,
            'materials.files.$': 1,
          },
        );

      // Object contains materials property.
      // Files array within materials will alway contain one element
      return fileMetaData.materials.files[0];
    } catch (e) {
      Promise.reject(e);
    }
  }

  /**
   * Builds query object for Learning Object search
   *
   * @private
   * @param {boolean} accessUnpublished
   * @param {string} text
   * @param {string[]} authorIDs
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @param {string} name
   * @returns
   * @memberof MongoDriver
   */
  private buildSearchQuery(
    accessUnpublished: boolean,
    text: string,
    authors: { _id: string; username: string }[],
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    name: string,
    collection: string,
    exactAuthor?: boolean,
    released?: boolean,
  ) {
    let query: any = <any>{};
    if (!accessUnpublished) {
      query.published = true;
    }
    if (released) {
      // Check that the learning object does not have a download restriction
      query['lock.restrictions'] = { $nin: [Restriction.DOWNLOAD]};
    }
    // Search By Text
    if (text || text === '') {
      query = this.buildTextSearchQuery(
        query,
        text,
        authors,
        exactAuthor,
        status,
        length,
        level,
        outcomeIDs,
        collection,
      );
    } else {
      // Search by fields
      query = this.buildFieldSearchQuery(
        name,
        query,
        authors,
        status,
        length,
        level,
        outcomeIDs,
        collection,
        exactAuthor,
      );
    }
    return query;
  }

  /**
   * Builds Learning Object Query based on Fields
   *
   * @private
   * @param {string} name
   * @param {*} query
   * @param {{ _id: string; username: string }[]} authors
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @returns
   * @memberof MongoDriver
   */
  private buildFieldSearchQuery(
    name: string,
    query: any,
    authors: { _id: string; username: string }[],
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    collection: string,
    exactAuthor: boolean,
  ) {
    if (name) {
      query.$text = { $search: name };
    }
    if (authors) {
      if (exactAuthor) {
        query.authorID = authors[0]._id;
      } else {
        query.$or.push(
          <any>{
            authorID: { $in: authors.map(author => author._id) },
          },
          {
            contributors: { $in: authors.map(author => author.username) },
          },
        );
      }
    }
    
    if (length) {
      query.length = { $in: length };
    }
    if (level) {
      query.levels = { $in: level };
    }
    if (status) {
      query.status = { $in: status };
    }
    if (outcomeIDs) {
      query.outcomes = { $in: outcomeIDs };
    }
    if (collection) {
      query.collection = collection;
    }

    return query;
  }

  /**
   * Builds Learning Object Query based on Text
   *
   * @private
   * @param {*} query
   * @param {string} text
   * @param {{ _id: string; username: string }[]} authors
   * @param {boolean} exactAuthor
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @returns
   * @memberof MongoDriver
   */
  private buildTextSearchQuery(
    query: any,
    text: string,
    authors: { _id: string; username: string }[],
    exactAuthor: boolean,
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    collection: string,
  ) {
    const regex = new RegExp(sanitizeRegex(text));
    query.$or = [
      { $text: { $search: text } },
      { name: { $regex: regex } },
      { contributors: { $regex: regex } },
    ];
    if (authors && authors.length) {
      if (exactAuthor) {
        query.authorID = authors[0]._id;
      } else {
        query.$or.push(
          <any>{
            authorID: { $in: authors.map(author => author._id) },
          },
          {
            contributors: { $in: authors.map(author => author.username) },
          },
        );
      }
    }
    if (length) {
      query.length = { $in: length };
    }
    if (level) {
      query.levels = { $in: level };
    }
    if (status) {
      query.status = { $in: status };
    }
    if (collection) {
      query.collection = collection;
    }
    if (outcomeIDs) {
      query.outcomes = outcomeIDs.length
        ? { $in: outcomeIDs }
        : ['DONT MATCH ME'];
    }
    return query;
  }

  private applyCursorFilters<T>(
    cursor: Cursor<T>,
    filters: Filters,
  ): Cursor<T> {
    try {
      if (filters.page !== undefined && filters.page <= 0) {
        filters.page = 1;
      }
      const skip =
        filters.page && filters.limit
          ? (filters.page - 1) * filters.limit
          : undefined;

      // Paginate if has limiter
      cursor =
        skip !== undefined
          ? cursor.skip(skip).limit(filters.limit)
          : filters.limit
            ? cursor.limit(filters.limit)
            : cursor;

      // SortBy
      cursor = filters.orderBy
        ? cursor.sort(filters.orderBy, filters.sortType ? filters.sortType : 1)
        : cursor;
      return cursor;
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Gets Learning Outcome IDs that contain Standard Outcome IDs
   *
   * @private
   * @param {string[]} standardOutcomeIDs
   * @returns {Promise<LearningOutcomeDocument[]>}
   * @memberof MongoDriver
   */
  private async matchOutcomes(
    standardOutcomeIDs: string[],
  ): Promise<LearningOutcomeDocument[]> {
    return standardOutcomeIDs
      ? await this.db
          .collection(COLLECTIONS.LearningOutcome.name)
          .find<LearningOutcomeDocument>({
            mappings: { $all: standardOutcomeIDs },
          })
          .toArray()
      : null;
  }
  /**
   * Search for users that match author or text param
   *
   * @private
   * @param {string} author
   * @param {string} text
   * @returns {Promise<UserDocument[]>}
   * @memberof MongoDriver
   */
  private async matchUsers(
    author: string,
    text: string,
  ): Promise<{ _id: string; username: string }[]> {
    const query = {
      $or: [{ $text: { $search: author ? author : text } }],
    };
    if (text) {
      const regex = new RegExp(sanitizeRegex(text), 'ig');
      (<any[]>query.$or).push(
        { username: { $regex: regex } },
        { name: { $regex: regex } },
        { email: { $regex: regex } },
      );
    }
    return author || text
      ? await this.db
          .collection(COLLECTIONS.User.name)
          .find<{ _id: string; username: string }>(query)
          .project({
            _id: 1,
            username: 1,
            score: { $meta: 'textScore' },
          })
          .sort({ score: { $meta: 'textScore' } })
          .toArray()
      : Promise.resolve(null);
  }
  /**
   * Fetches all Learning Object collections
   *
   * @returns {Promise<LearningObjectCollection[]>}
   * @memberof MongoDriver
   */
  async fetchCollections(): Promise<LearningObjectCollection[]> {
    try {
      const collections = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .aggregate([
          {$project: {
            _id: 0,
            name: 1,
            abvName: 1,
            hasLogo: 1,
          }},
        ]).toArray();
      return collections;
    } catch (e) {
      console.error(e);
      return Promise.reject(e);
    }
  }
  /**
   * Fetches Learning Object Collection by name
   *
   * @param {string} name
   * @returns {Promise<LearningObjectCollection>}
   * @memberof MongoDriver
   */
  async fetchCollection(name: string): Promise<LearningObjectCollection> {
    try {
      const collection = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .findOne({ name: name });
      const objects = await Promise.all(
        collection.learningObjects.map((id: string) => {
          return this.fetchLearningObject(id, false, false);
        }),
      );

      collection.learningObjects = objects;
      return collection;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async fetchCollectionMeta(
    name: string,
  ): Promise<{ name: string; abstracts?: any[] }> {
    try {
      const meta: any = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .findOne({ name }, <any>{ name: 1, abstracts: 1 });
      return meta;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async fetchCollectionObjects(name: string): Promise<LearningObject[]> {
    try {
      const collection: any = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .findOne({ name }, <any>{ learningObjects: 1 });
      const objects = await Promise.all(
        collection.learningObjects.map((id: string) => {
          return this.fetchLearningObject(id, false, false);
        }),
      );
      collection.learningObjects = objects;
      return collection;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async addToCollection(
    learningObjectId: string,
    collection: string,
  ): Promise<void> {
    try {
      // access learning object and update it's collection property
      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOneAndUpdate({ _id: learningObjectId }, { $set: { collection } });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  ////////////////////////////////////////////////
  // GENERIC HELPER METHODS - not in public API //
  ////////////////////////////////////////////////
  /**
   * Converts Learning Object to Document
   *
   * @private
   * @param {LearningObject} object
   * @param {boolean} [isNew]
   * @param {string} [id]
   * @returns {Promise<LearningObjectDocument>}
   * @memberof MongoDriver
   */
  private async documentLearningObject(
    object: LearningObject,
    isNew?: boolean,
    id?: string,
  ): Promise<LearningObjectDocument> {
    try {
      const authorID = await this.findUser(object.author.username);
      let contributorIds: string[] = [];

      if (object.contributors && object.contributors.length) {
        contributorIds = await Promise.all(
          object.contributors.map(user => this.findUser(user.username)),
        );
      }

      const doc: LearningObjectDocument = {
        authorID: authorID,
        name: object.name,
        date: object.date,
        length: object.length,
        levels: object.levels,
        goals: object.goals.map(goal => {
          return {
            text: goal.text,
          };
        }),
        outcomes: [],
        materials: object.materials,
        published: object.published,
        contributors: contributorIds,
        collection: object.collection,
        lock: object.lock,
      };
      if (isNew) {
        doc._id = new ObjectID().toHexString();
      } else {
        doc._id = id;
        delete doc.outcomes;
      }
      return doc;
    } catch (e) {
      return Promise.reject(
        `Problem creating document for Learning Object. Error:${e}`,
      );
    }
  }
  /**
   * Converts Learning Outcome to Document
   *
   * @private
   * @param {LearningOutcome} outcome
   * @param {{
   *       learningObjectID: string;
   *       learningObjectName: string;
   *       authorName: string;
   *     }} source
   * @param {boolean} [isNew]
   * @returns {Promise<LearningOutcomeDocument>}
   * @memberof MongoDriver
   */
  private documentLearningOutcome(
    outcome: LearningOutcome,
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
    isNew?: boolean,
  ): LearningOutcomeDocument {
    try {
      const doc: LearningOutcomeDocument = {
        source: source.learningObjectID,
        tag: outcome.tag,
        author: source.authorName,
        name: source.learningObjectName,
        date: outcome.date,
        outcome: outcome.outcome,
        bloom: outcome.bloom,
        verb: outcome.verb,
        text: outcome.text,
        assessments: outcome.assessments.map(assessment => {
          return {
            plan: assessment.plan,
            text: assessment.text,
          };
        }),
        strategies: outcome.strategies.map(strategy => {
          return { plan: strategy.plan, text: strategy.text };
        }),
        mappings: outcome.mappings.map(mapping => mapping.id),
      };

      if (isNew) {
        doc._id = new ObjectID().toHexString();
      }
      return doc;
    } catch (e) {
      throw new Error(
        `Problem creating document for Learning Outcome. Error:${e}`,
      );
    }
  }

  /**
   * Generates Learning Object from Document
   *
   * @private
   * @param {User} author
   * @param {LearningObjectDocument} record
   * @param {boolean} [full]
   * @returns {Promise<LearningObject>}
   * @memberof MongoDriver
   */
  private async generateLearningObject(
    author: User,
    record: LearningObjectDocument,
    full?: boolean,
  ): Promise<LearningObject> {
    // Logic for loading any learning object
    const learningObject = new LearningObject(author, record.name);
    learningObject.id = record._id;
    learningObject.date = record.date;
    learningObject.length = record.length;
    learningObject.levels = <AcademicLevel[]>record.levels;
    learningObject.materials = <Material>record.materials;
    record.published ? learningObject.publish() : learningObject.unpublish();
    learningObject.children = record.children;
    learningObject.lock = record.lock;
    learningObject.collection = record.collection;
    learningObject.status = record.status;
    for (const goal of record.goals) {
      learningObject.addGoal(goal.text);
    }
    if (!full) {
      return learningObject;
    }

    // Logic for loading 'full' learning objects

    // Load Contributors
    if (record.contributors && record.contributors.length) {
      learningObject.contributors = await Promise.all(
        record.contributors.map(async user => {
          let id: string;
          if (typeof user === 'string') {
            id = user;
          } else {
            const obj = User.instantiate(user);
            id = await this.findUser(obj.username);
            reportError(
              new Error(
                `Learning object ${
                  record._id
                } contains an invalid type for contributors property.`,
              ),
            );
          }
          return this.fetchUser(id);
        }),
      );
    }
    // load each outcome
    await Promise.all(
      record.outcomes.map(async outcomeID => {
        const rOutcome = await this.fetchLearningOutcome(outcomeID);

        const outcome = learningObject.addOutcome();
        outcome.bloom = rOutcome.bloom;
        outcome.verb = rOutcome.verb;
        outcome.text = rOutcome.text;
        for (const rAssessment of rOutcome.assessments) {
          const assessment = outcome.addAssessment();
          assessment.plan = rAssessment.plan;
          assessment.text = rAssessment.text;
        }
        for (const rStrategy of rOutcome.strategies) {
          const strategy = outcome.addStrategy();
          strategy.plan = rStrategy.plan;
          strategy.text = rStrategy.text;
        }

        // only extract the basic info for each mapped outcome
        for (const mapping of rOutcome.mappings) {
          outcome.mapTo(mapping);
        }
      }),
    );

    return learningObject;
  }
  /**
   * Generates LearningOutcome from Document
   *
   * @private
   * @param {LearningOutcomeDocument} record
   * @returns {Promise<LearningOutcome>}
   * @memberof MongoDriver
   */
  private async generateLearningOutcome(
    record: LearningOutcomeDocument,
  ): Promise<LearningOutcome> {
    try {
      const outcome = new LearningOutcome(new LearningObject());
      outcome.bloom = record.bloom;
      outcome.verb = record.verb;
      outcome.text = record.text;
      // Add assessments
      for (const rAssessment of record.assessments) {
        const assessment = outcome.addAssessment();
        assessment.plan = rAssessment.plan;
        assessment.text = rAssessment.text;
      }
      // Add Strategies
      for (const rStrategy of record.strategies) {
        const strategy = outcome.addStrategy();
        strategy.plan = rStrategy.plan;
        strategy.text = rStrategy.text;
      }
      for (const mappingID of record.mappings) {
        const mapping = await this.fetchOutcome(mappingID);
        outcome.mapTo(mapping);
      }
      return outcome;
    } catch (e) {
      return Promise.reject(`Problem generating LearningOutcome. Error: ${e}`);
    }
  }
  /**
   * Generates Outcome from Document
   *
   * @private
   * @param {StandardOutcomeDocument} record
   * @returns {Outcome}
   * @memberof MongoDriver
   */
  private generateStandardOutcome(record: StandardOutcomeDocument): Outcome {
    const outcome: Outcome = {
      id: record._id,
      author: record.author,
      name: record.name,
      date: record.date,
      outcome: record.outcome,
    };

    return outcome;
  }

  /**
   * Reject promise if any foreign keys in a record do not exist.
   * @async
   *
   * @param {Function} schema provides information for each foreign key
   * @param {Record} record which record to validate
   * @param {Set<string>} foreigns which fields to check
   *
   * @returns none, but promise will be rejected if there is a problem
   */
  private async validateForeignKeys<T>(
    record: T,
    foreigns: Foreign[],
  ): Promise<void> {
    try {
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;
          // get id's to check, as an array
          let keys = record[foreign.name];
          if (!(keys instanceof Array)) keys = [keys];
          // fetch foreign document and reject if it doesn't exist
          for (const key of keys) {
            const collection = COLLECTIONS_MAP.get(data.target);
            const count = await this.db
              .collection(collection.name)
              .count({ _id: key });
            if (count === 0) {
              return Promise.reject(
                'Foreign key error for ' +
                  record +
                  ': ' +
                  key +
                  ' not in ' +
                  data.target +
                  ' collection',
              );
            }
          }
        }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem validating key constraint :\n\t' + e);
    }
  }

  /**
   * Add an item's id to a foreign registry.
   * @async
   *
   * @param {string} collection where to find the foreign registry owner
   * @param {RecordID} owner the foreign registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to add
   */
  private async register(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Registration failed: no owner ' +
            owner +
            'found in ' +
            collection.name,
        );

      const pushdoc = {};
      pushdoc[registry] = item;

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $push: pushdoc });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem registering to a ' +
          collection.name +
          ' ' +
          registry +
          ' field:\n\t' +
          e,
      );
    }
  }

  /**
   * Remove an item's id from a foreign registry.
   * @async
   *
   * @param {string} collection where to find the foreign registry owner
   * @param {RecordID} owner the foreign registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to remove
   */
  private async unregister(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Un-registration failed: no record ' +
            owner +
            'found in ' +
            collection,
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Un-registration failed: record ' +
            owner +
            ' s' +
            registry +
            ' field has no element ' +
            item,
        );
      }

      const pulldoc = {};
      pulldoc[registry] = item;

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $pull: pulldoc });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem un-registering from a ' +
          collection.name +
          ' ' +
          registry +
          ' field:\n\t' +
          e,
      );
    }
  }

  /**
   * Reorder an item in a registry.
   * @async
   *
   * @param {string} collection where to find the registry owner
   * @param {RecordID} owner the registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to move
   * @param {number} index the new index for item
   */
  private async reorder(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
    index: number,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Reorder failed: no record ' + owner + 'found in ' + collection.name,
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Reorder failed: record ' +
            owner +
            ' s' +
            registry +
            ' field has no element ' +
            item,
        );
      }
      if (index < 0)
        return Promise.reject('Reorder failed: index cannot be negative');
      if (index >= record[registry].length) {
        return Promise.reject(
          'Reorder failed: index exceeds length of ' + registry + ' field',
        );
      }

      // perform the necessary operations
      await this.unregister(collection, owner, registry, item);

      const pushdoc = {};
      pushdoc[registry] = { $each: [item], $position: index };

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $push: pushdoc });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Insert a generic item to the database.
   * @async
   *
   * @param {Function} schema provides collection/validation information
   * @param {Insert} record document to insert
   *
   * @returns {RecordID} the database id of the new record
   */
  private async insert<T>(collection: Collection, record: T): Promise<string> {
    try {
      const foreigns = collection.foreigns;
      if (foreigns) {
        // check validity of all foreign keys
        await this.validateForeignKeys(record, foreigns);
      }

      // perform the actual insert
      const insert_ = await this.db
        .collection(collection.name)
        .insertOne(record);
      const id = insert_.insertedId;

      // register the new record as needed
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;
          if (!data.child && data.registry) {
            const collection = COLLECTIONS_MAP.get(data.target);
            await this.register(
              collection,
              record[foreign.name],
              data.registry,
              `${id}`,
            );
          }
        }
      return Promise.resolve(`${id}`);
    } catch (e) {
      return Promise.reject(
        'Problem inserting a ' + collection.name + ':\n\t' + e,
      );
    }
  }

  /**
   * Edit (update without foreigns) a generic item in the database.
   * @async
   *
   * @param {Function} schema provides collection/validation information
   * @param {RecordID} id which document to edit
   * @param {Edit} record the values to change to
   */
  private async edit<T>(
    collection: Collection,
    id: string,
    record: T,
  ): Promise<void> {
    try {
      // no foreign fields, no need to validate

      // perform the actual update
      await this.db
        .collection(collection.name)
        .updateOne({ _id: id }, { $set: record });

      // registered fields must be fixed, nothing to change here

      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject(
        'Problem editing a ' + collection.name + ':\n\t' + e,
      );
    }
  }

  /**
   * Cascade delete a record and its children.
   * @async
   *
   * @param {COLLECTIONS} collection provides collection information
   * @param {string} id the document to delete
   */
  private async remove<T>(collection: Collection, id: string): Promise<void> {
    try {
      const record = await this.db
        .collection(collection.name)
        .findOne<T>({ _id: id });

      // remove all children recursively, and unregister from parents
      const foreigns = collection.foreigns;
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;

          if (data.child) {
            // get children to remove, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // remove each child
            for (const key of keys) {
              const collection = COLLECTIONS_MAP.get(data.target);
              await this.remove(collection, key);
            }
          }

          if (!data.child && data.registry) {
            // get registries to edit, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // unregister from each key
            for (const key of keys) {
              const collection = COLLECTIONS_MAP.get(data.target);
              await this.unregister(collection, key, data.registry, id);
            }
          }
        }

      // perform actual deletion
      await this.db.collection(collection.name).deleteOne({ _id: id });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem deleting ' + collection + ':\n\t' + e);
    }
  }

  /**
   * Fetch a database record by its id.
   * @param {Function} schema provides collection information
   * @param {string} id the document to fetch
   */
  private async fetch<T>(collection: Collection, id: string): Promise<T> {
    const record = await this.db
      .collection(collection.name)
      .findOne<T>({ _id: id });
    if (!record)
      return Promise.reject(
        'Problem fetching a ' +
          collection.name +
          ':\n\tInvalid database id ' +
          JSON.stringify(id),
      );
    return Promise.resolve(record);
  }
}

export function isEmail(value: string): boolean {
  const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailPattern.test(value)) {
    return true;
  }
  return false;
}

/**
 * Escapes Regex quantifier, alternation, single sequence anchor, new line, and parenthesis characters in a string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
export function sanitizeRegex(text: string): string {
  const regexChars = /\.|\+|\*|\^|\$|\?|\[|\]|\(|\)|\|/;
  if (regexChars.test(text)) {
    let newString = '';
    const chars = text.split('');
    for (const c of chars) {
      const isSpecial = regexChars.test(c.trim());
      if (isSpecial) {
        newString += `\\${c}`;
      } else {
        newString += c;
      }
    }
    text = newString;
  }
  return text;
}
