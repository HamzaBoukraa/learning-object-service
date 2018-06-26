import {
  DataStore,
  Responder,
  Interactor,
  FileManager,
} from '../interfaces/interfaces';
import {
  User,
  LearningObject,
  AcademicLevel,
  Outcome,
  StandardOutcome,
  LearningOutcome,
  LearningGoal,
  AssessmentPlan,
  InstructionalStrategy,
} from '@cyber4all/clark-entity';

import * as stopword from 'stopword';
import * as stemmer from 'stemmer';
import { LearningObjectQuery } from '../interfaces/DataStore';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { CartInteractor } from './CartInteractor';

export class LearningObjectInteractor {
  /**
   * Load the scalar fields of a user's objects (ignore goals and outcomes).
   * @async
   *
   * @param {string} userid the user's login id
   *
   * @returns {User}
   */
  public static async loadLearningObjectSummary(
    dataStore: DataStore,
    username: string,
    accessUnpublished?: boolean,
    loadChildren?: boolean,
    query?: LearningObjectQuery,
  ): Promise<LearningObject[]> {
    try {
      let total = 0;
      let summary: LearningObject[] = [];
      if (
        query &&
        (query.name ||
          query.length ||
          query.level ||
          query.standardOutcomeIDs ||
          query.text)
      ) {
        const response = await this.searchObjects(
          dataStore,
          query.name,
          username,
          query.length,
          query.level,
          query.standardOutcomeIDs,
          query.text,
          accessUnpublished,
          query.orderBy,
          query.sortType,
          query.page,
          query.limit,
        );
        summary = response.objects;
        total = response.total;
      } else {
        const objectIDs = await dataStore.getUserObjects(username);
        summary = await dataStore.fetchMultipleObjects(
          objectIDs,
          false,
          accessUnpublished,
          query ? query.orderBy : null,
          query ? query.sortType : null,
        );
        total = summary.length;
      }

      if (loadChildren) {
        summary = await Promise.all(
          summary.map(async object => {
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                dataStore,
                object,
                false,
                accessUnpublished,
              );
            }
            return object;
          }),
        );
      }

      summary = await Promise.all(
        summary.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return summary;
    } catch (e) {
      return Promise.reject(`Problem loading summary. Error: ${e}`);
    }
  }

  /**
   * Load a learning object and all its learning outcomes.
   * @async
   *
   * @param {UserID} author the author's database id
   * @param {string} name the learning object's identifying string
   *
   * @returns {LearningObject}
   */
  public static async loadLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    try {
      const fullChildren = false;
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        true,
        accessUnpublished,
      );
      if (accessUnpublished) {
        learningObject.id = learningObjectID;
      }

      if (learningObject.children) {
        learningObject.children = await this.loadChildObjects(
          dataStore,
          learningObject,
          fullChildren,
          accessUnpublished,
        );
      }

      try {
        learningObject.metrics = await this.loadMetrics(learningObjectID);
      } catch (e) {
        console.log(e);
      }

      return learningObject;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private static async loadChildObjects(
    dataStore: DataStore,
    learningObject: LearningObject,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject[]> {
    if (learningObject.children) {
      let children = await dataStore.fetchMultipleObjects(
        <string[]>learningObject.children,
        full,
        accessUnpublished,
      );

      children = await Promise.all(
        children.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      for (let child of children) {
        child.children = await this.loadChildObjects(
          dataStore,
          child,
          full,
          accessUnpublished,
        );
      }
      return [...children];
    }
    return null;
  }

  public static async loadFullLearningObjectByIDs(
    dataStore: DataStore,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(ids, true);

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem loading full LearningObject by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Add a new learning object to the database.
   * NOTE: this function only adds basic fields;
   *       the user.outcomes field is ignored
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {UserID} author - database id of the parent
   * @param {LearningObject} object - entity to add
   *
   * @returns {LearningObjectID} the database id of the new record
   */
  public static async addLearningObject(
    dataStore: DataStore,
    object: LearningObject,
  ): Promise<LearningObject> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      } else {
        const learningObjectID = await dataStore.insertLearningObject(object);
        object.id = learningObjectID;
        return object;
      }
    } catch (e) {
      if (/duplicate key error/gi.test(e)) {
        return Promise.reject(
          `Could not save Learning Object. Learning Object with name: ${
            object.name
          } already exists.`,
        );
      }
      return Promise.reject(`Problem creating Learning Object. Error${e}`);
    }
  }

  private static validateLearningObject(object: LearningObject): string {
    let error = null;
    if (object.name.trim() === '') {
      error = 'Learning Object name cannot be empty.';
    } else if (object.published && !object.outcomes.length) {
      error = 'Learning Object must have outcomes to publish.';
    } else if (object.published && !object.goals[0].text) {
      error = 'Learning Object must have a description to publish.';
    }
    return error;
  }
  /**
   * Upload Materials and sends back array of LearningObject Materials
   *
   * @static
   * @param {FileManager} fileManager
   * @param {Responder} responder
   * @param {string} id
   * @param {string} username
   * @param {any[]} files
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async uploadMaterials(
    fileManager: FileManager,
    id: string,
    username: string,
    files: any[],
    filePathMap: Map<string, string>,
  ): Promise<any> {
    try {
      const learningObjectFiles = await fileManager.upload(
        id,
        username,
        files,
        filePathMap,
      );
      return learningObjectFiles;
    } catch (e) {
      return Promise.reject(`Problem uploading materials. Error: ${e}`);
    }
  }

  /**
   * Deletes specified file
   *
   * @static
   * @param {FileManager} fileManager
   * @param {Responder} responder
   * @param {string} id
   * @param {string} username
   * @param {string} filename
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async deleteFile(
    fileManager: FileManager,
    id: string,
    username: string,
    filename: string,
  ): Promise<void> {
    try {
      return fileManager.delete(id, username, filename);
    } catch (e) {
      return Promise.reject(`Problem deleting file. Error: ${e}`);
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
  public static async findLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
  ): Promise<string> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      return learningObjectID;
    } catch (e) {
      return Promise.reject(`Problem finding LearningObject. Error: ${e}`);
    }
  }

  /**
   * Update an existing learning object record.
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {LearningObjectID} id - database id of the record to change
   * @param {LearningObject} object - entity with values to update to
   */
  public static async updateLearningObject(
    dataStore: DataStore,
    id: string,
    object: LearningObject,
  ): Promise<void> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      } else {
        return dataStore.editLearningObject(id, object);
      }
    } catch (e) {
      return Promise.reject(`Problem updating Learning Object. Error: ${e}`);
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const object = await dataStore.fetchLearningObject(id, true, true);
      published ? object.publish() : object.unpublish();
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      }
      return dataStore.togglePublished(username, id, published);
    } catch (e) {
      return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectName: string,
  ): Promise<void> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        false,
        true,
      );
      await dataStore.deleteLearningObject(learningObjectID);
      if (learningObject.materials.files.length) {
        await fileManager.deleteAll(learningObjectID, username);
      }
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Object. Error: ${error}`,
      );
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectNames: string[],
  ): Promise<void> {
    try {
      const learningObjectsWithFiles: LearningObject[] = [];
      const learningObjectIDs: string[] = [];
      for (let name of learningObjectNames) {
        const id = await dataStore.findLearningObject(username, name);
        learningObjectIDs.push(id);
        const object = await dataStore.fetchLearningObject(id, false, true);
        object.id = id;
        if (object.materials.files.length)
          learningObjectsWithFiles.push(object);
      }
      await dataStore.deleteMultipleLearningObjects(learningObjectIDs);

      for (let object of learningObjectsWithFiles) {
        await fileManager.deleteAll(object.id, username);
      }
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Objects. Error: ${error}`,
      );
    }
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {LearningObject[]} array of literally all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    currPage: number,
    limit: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const accessUnpublished = false;
      const response = await dataStore.fetchAllObjects(
        accessUnpublished,
        currPage,
        limit,
      );
      response.objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return response;
    } catch (e) {
      return Promise.reject(
        `Problem fetching all Learning Objects. Error: ${e}`,
      );
    }
  }

  /**
   * TODO: Refactor into fetchAllObjects. DRY
   * Returns array of learning objects associated with the given ids.
   * @returns {LearningObjectRecord[]}
   */
  public static async fetchMultipleObjects(
    dataStore: DataStore,
    ids: { username: string; learningObjectName: string }[],
  ): Promise<LearningObject[]> {
    try {
      // Get IDs associated with LearningObjects
      const learningObjectIDs = await Promise.all(
        ids.map(id => {
          return new Promise<string>((resolve, reject) => {
            dataStore
              .findLearningObject(id.username, id.learningObjectName)
              .then(
                learningObjectID => resolve(learningObjectID),
                err => reject(err),
              );
          });
        }),
      );

      let learningObjects: LearningObject[] = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
        false,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching multiple Learning Objects. Error: ${e}`,
      );
    }
  }

  public static async fetchObjectsByIDs(
    dataStore: DataStore,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(
        ids,
        true,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Search for objects by name, author, length, level, and content.
   *
   * @param {string} name the objects' names should closely relate
   * @param {string} author the objects' authors' names` should closely relate
   * @param {string} length the objects' lengths should match exactly
   * @param {string} level the objects' levels should match exactly TODO: implement
   * @param {boolean} ascending whether or not result should be in ascending order
   *
   * @returns {Outcome[]} list of outcome suggestions, ordered by score
   */
  public static async searchObjects(
    dataStore: DataStore,
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number,
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      if (text) {
        text = this.removeStopwords(text);
        text = this.stemWords(text);
      }
      const response = await dataStore.searchObjects(
        name,
        author,
        length,
        level,
        standardOutcomeIDs,
        text,
        accessUnpublished,
        orderBy,
        sortType,
        currPage,
        limit,
      );

      response.objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return response;
    } catch (e) {
      return Promise.reject(`Problem suggesting Learning Objects. Error:${e}`);
    }
  }

  public static async fetchCollections(
    dataStore: DataStore,
    loadObjects?: boolean,
  ): Promise<any> {
    try {
      const collections = await dataStore.fetchCollections(loadObjects);
      return collections;
    } catch (e) {
      return Promise.reject(`Problem fetching collections. Error: ${e}`);
    }
  }

  public static async fetchCollection(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const collection = await dataStore.fetchCollection(name);
      return collection;
    } catch (e) {
      return Promise.reject(`Problem fetching collection. Error: ${e}`);
    }
  }

  public static async fetchCollectionMeta(dataStore: DataStore, name: string): Promise<any> {
    try {
      const collectionMeta = await dataStore.fetchCollectionMeta(name);
      return collectionMeta;
    } catch (e) {
      return Promise.reject(`Problem fetching collection metadata. Error: ${e}`);
    }
  }

  public static async fetchCollectionObjects(dataStore: DataStore, name: string): Promise<any> {
    try {
      const objects = await dataStore.fetchCollectionObjects(name);
      return objects;
    } catch (e) {
      return Promise.reject(`Problem fetching collection objects. Error: ${e}`);
    }
  }

  public static async addChild(params: {
    dataStore: DataStore;
    childId: string;
    username: string;
    parentName: string;
  }): Promise<void> {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      return params.dataStore.insertChild(parentID, params.childId);
    } catch (e) {
      return Promise.reject(`Problem adding child. Error: ${e}`);
    }
  }

  public static async removeChild(params: {
    dataStore: DataStore;
    childId: string;
    username: string;
    parentName: string;
  }) {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      return params.dataStore.deleteChild(parentID, params.childId);
    } catch (e) {
      return Promise.reject(`Problem removing child. Error: ${e}`);
    }
  }
  /**
   * Fetches Metrics for Learning Object
   *
   * @private
   * @static
   * @param {string} objectID
   * @returns {Promise<Metrics>}
   * @memberof LearningObjectInteractor
   */
  private static async loadMetrics(objectID: string): Promise<Metrics> {
    try {
      return CartInteractor.getMetrics(objectID);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Returns stems for words in a string
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static stemWords(text: string): string {
    text = text
      .split(' ')
      .map(word => stemmer(word))
      .join(' ')
      .trim();
    return text;
  }

  /**
   * Returns string without stopwords
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static removeStopwords(text: string): string {
    const oldString = text.split(' ');
    text = stopword
      .removeStopwords(oldString)
      .join(' ')
      .trim();
    return text;
  }
}
