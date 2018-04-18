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
    responder: Responder,
    username: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<void> {
    try {
      const objectIDs = await dataStore.getUserObjects(username);
      const summary: LearningObject[] = await dataStore.fetchMultipleObjects(
        objectIDs,
        false,
        accessUnpublished,
        orderBy,
        sortType,
      );
      responder.sendObject(summary);
    } catch (e) {
      responder.sendOperationError(e);
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
    responder: Responder,
    username: string,
    learningObjectName: string,
    accessUnpublished?: boolean,
  ): Promise<void> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        true,
        accessUnpublished,
      );
      if (accessUnpublished) learningObject.id = learningObjectID;

      if (learningObject.children) {
        learningObject.children = await this.loadChildObjects(
          dataStore,
          learningObject,
        );
      }
      responder.sendObject(learningObject);
    } catch (e) {
      console.log(e);
      responder.sendOperationError(e);
    }
  }

  private static async loadChildObjects(
    dataStore: DataStore,
    learningObject: LearningObject,
  ) {
    // console.log(learningObject);
    if (learningObject.children) {
      const children = await dataStore.fetchMultipleObjects(
        learningObject.children,
      );
      for (let child of children) {
        child.children = await this.loadChildObjects(dataStore, child);
      }
      return [...children];
    }
    return null;
  }

  public static async loadFullLearningObjectByIDs(
    dataStore: DataStore,
    responder: Responder,
    ids: string[],
  ): Promise<void> {
    try {
      const learningObjects = await dataStore.fetchMultipleObjects(ids, true);
      responder.sendObject(learningObjects);
    } catch (e) {
      console.log(e);
      responder.sendOperationError(e);
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
    responder: Responder,
    object: LearningObject,
  ): Promise<void> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        responder.sendOperationError(err);
        return;
      } else {
        const learningObjectID = await dataStore.insertLearningObject(object);
        responder.sendObject(learningObjectID);
      }
    } catch (e) {
      if (/duplicate key error/gi.test(e)) {
        responder.sendOperationError(
          `Could not save Learning Object. Learning Object with name: ${
            object.name
          } already exists.`,
        );
      } else
        responder.sendOperationError(
          `Problem creating Learning Object. Error${e}`,
        );
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
    responder: Responder,
    id: string,
    username: string,
    files: any[],
    filePathMap: Map<string, string>,
  ): Promise<void> {
    try {
      const learningObjectFiles = await fileManager.upload(
        id,
        username,
        files,
        filePathMap,
      );
      responder.sendObject(learningObjectFiles);
    } catch (e) {
      responder.sendOperationError(`Problem uploading materials. Error: ${e}`);
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
    responder: Responder,
    id: string,
    username: string,
    filename: string,
  ): Promise<void> {
    try {
      await fileManager.delete(id, username, filename);
      responder.sendOperationSuccess();
    } catch (e) {
      responder.sendOperationError(`Problem deleting file. Error: ${e}`);
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
    responder: Responder,
    username: string,
    learningObjectName: string,
  ): Promise<void> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      responder.sendObject(learningObjectID);
    } catch (e) {
      responder.sendOperationError(e);
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
    responder: Responder,
    id: string,
    object: LearningObject,
  ): Promise<void> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        responder.sendOperationError(err);
        return;
      } else {
        await dataStore.editLearningObject(id, object);
        responder.sendOperationSuccess();
      }
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    responder: Responder,
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const object = await dataStore.fetchLearningObject(id, true, true);
      published ? object.publish() : object.unpublish();
      const err = this.validateLearningObject(object);
      if (err) {
        responder.sendOperationError(err);
        return;
      }
      await dataStore.togglePublished(username, id, published);
      responder.sendOperationSuccess();
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    responder: Responder,
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
      responder.sendOperationSuccess();
    } catch (error) {
      responder.sendOperationError(error);
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    responder: Responder,
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
      responder.sendOperationSuccess();
    } catch (error) {
      responder.sendOperationError(error);
    }
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {LearningObject[]} array of literally all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    responder: Responder,
    currPage: number,
    limit: number,
  ): Promise<void> {
    try {
      const response = await dataStore.fetchAllObjects(currPage, limit);
      responder.sendObject(response);
    } catch (e) {
      console.log(e);
      responder.sendOperationError(e);
    }
  }

  /**
   * TODO: Refactor into fetchAllObjects. DRY
   * Returns array of learning objects associated with the given ids.
   * @returns {LearningObjectRecord[]}
   */
  public static async fetchMultipleObjects(
    dataStore: DataStore,
    responder: Responder,
    ids: { username: string; learningObjectName: string }[],
  ): Promise<void> {
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

      const learningObjects: LearningObject[] = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
        false,
        true,
      );
      responder.sendObject(learningObjects);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchObjectsByIDs(
    dataStore: DataStore,
    responder: Responder,
    ids: string[],
  ) {
    try {
      const learningObjects = await dataStore.fetchMultipleObjects(
        ids,
        true,
        true,
      );
      responder.sendObject(learningObjects);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  /**
   * Search for objects by name, author, length, level, and content.
   * FIXME: implementation is rough and probably not as efficient as it could be
   *
   * @param {string} name the objects' names should closely relate
   * @param {string} author the objects' authors' names` should closely relate
   * @param {string} length the objects' lengths should match exactly
   * @param {string} level the objects' levels should match exactly TODO: implement
   * @param {boolean} ascending whether or not result should be in ascending order
   *
   * @returns {Outcome[]} list of outcome suggestions, ordered by score
   */
  public static async suggestObjects(
    dataStore: DataStore,
    responder: Responder,
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number,
  ): Promise<void> {
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
        orderBy,
        sortType,
        currPage,
        limit,
      );
      responder.sendObject(response);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchCollections(
    dataStore: DataStore,
    responder: Responder,
    loadObjects?: boolean,
  ) {
    try {
      const collections = await dataStore.fetchCollections(loadObjects);
      responder.sendObject(collections);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchCollection(
    dataStore: DataStore,
    responder: Responder,
    name: string,
  ) {
    try {
      const collection = await dataStore.fetchCollection(name);
      responder.sendObject(collection);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async addChild(params: {
    dataStore: DataStore;
    responder: Responder;
    childId: string;
    username: string;
    parentName: string;
  }) {
    const parentID = await params.dataStore.findLearningObject(
      params.username,
      params.parentName,
    );
    params.dataStore
      .insertChild(parentID, params.childId)
      .then(data => params.responder.sendOperationSuccess())
      .catch(error =>
        params.responder.sendOperationError(error.message, error.status),
      );
  }

  public static async removeChild(params: {
    dataStore: DataStore;
    responder: Responder;
    childId: string;
    username: string;
    parentName: string;
  }) {
    const parentID = await params.dataStore.findLearningObject(
      params.username,
      params.parentName,
    );
    params.dataStore
      .deleteChild(parentID, params.childId)
      .then(data => params.responder.sendOperationSuccess())
      .catch(error =>
        params.responder.sendOperationError(error.message, error.status),
      );
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
