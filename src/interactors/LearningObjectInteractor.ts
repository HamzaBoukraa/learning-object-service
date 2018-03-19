import { DataStore, Responder, Interactor } from '../interfaces/interfaces';
import {
  User,
  LearningObject,
  AcademicLevel,
  Outcome,
  StandardOutcome,
  LearningOutcome,
  LearningGoal,
  AssessmentPlan,
  InstructionalStrategy
} from '@cyber4all/clark-entity';

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
    accessUnpublished?: boolean
  ): Promise<void> {
    try {
      let objectIDs = await dataStore.getUserObjects(username);
      let summary: LearningObject[] = await dataStore.fetchMultipleObjects(
        objectIDs,
        false,
        accessUnpublished
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
    accessUnpublished?: boolean
  ): Promise<void> {
    try {
      let learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName
      );
      let learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        true,
        accessUnpublished
      );
      if (accessUnpublished) learningObject.id = learningObjectID;
      responder.sendObject(learningObject);
    } catch (e) {
      console.log(e);
      responder.sendOperationError(e);
    }
  }

  public static async loadFullLearningObjectByIDs(
    dataStore: DataStore,
    responder: Responder,
    ids: string[]
  ): Promise<void> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(ids, true);
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
    object: LearningObject
  ): Promise<void> {
    try {
      if (object.name.trim() === '') {
        responder.sendOperationError('Learning Object name cannot be empty.');
        return;
      } else {
        let learningObjectID = await dataStore.insertLearningObject(object);
        responder.sendObject(learningObjectID);
      }
    } catch (e) {
      if (/duplicate key error/gi.test(e)) {
        responder.sendOperationError(
          `Could not save Learning Object. Learning Object with name: ${
            object.name
          } already exists.`
        );
      } else
        responder.sendOperationError(
          `Problem creating Learning Object. Error${e}`
        );
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
    learningObjectName: string
  ): Promise<void> {
    try {
      let learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName
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
    object: LearningObject
  ): Promise<void> {
    try {
      if (object.name.trim() === '') {
        responder.sendOperationError('Learning Object name cannot be empty.');
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
    published: boolean
  ): Promise<void> {
    try {
      await dataStore.togglePublished(username, id, published);
      responder.sendOperationSuccess();
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    responder: Responder,
    username: string,
    learningObjectName: string
  ): Promise<void> {
    try {
      let learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName
      );
      await dataStore.deleteLearningObject(learningObjectID);
      responder.sendOperationSuccess();
    } catch (error) {
      responder.sendOperationError(error);
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    responder: Responder,
    username: string,
    learningObjectNames: string[]
  ): Promise<void> {
    try {
      let learningObjectIDs = await Promise.all(
        learningObjectNames.map(learningObjectName => {
          return dataStore.findLearningObject(username, learningObjectName);
        })
      );

      await dataStore.deleteMultipleLearningObjects(learningObjectIDs);
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
    limit: number
  ): Promise<void> {
    try {
      let response = await dataStore.fetchAllObjects(currPage, limit);
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
    ids: { username: string; learningObjectName: string }[]
  ): Promise<void> {
    try {
      //Get IDs associated with LearningObjects
      let learningObjectIDs = await Promise.all(
        ids.map(id => {
          return new Promise<string>((resolve, reject) => {
            dataStore
              .findLearningObject(id.username, id.learningObjectName)
              .then(
                learningObjectID => resolve(learningObjectID),
                err => reject(err)
              );
          });
        })
      );

      let learningObjects: LearningObject[] = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
        false,
        true
      );
      responder.sendObject(learningObjects);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchObjectsByIDs(
    dataStore: DataStore,
    responder: Responder,
    ids: string[]
  ) {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(
        ids,
        true,
        true
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
    limit?: number
  ): Promise<void> {
    try {
      let response = await dataStore.searchObjects(
        name,
        author,
        length,
        level,
        standardOutcomeIDs,
        text,
        orderBy,
        sortType,
        currPage,
        limit
      );
      responder.sendObject(response);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchCollections(
    dataStore: DataStore,
    responder: Responder,
    loadObjects?: boolean
  ) {
    try {
      let collections = await dataStore.fetchCollections(loadObjects);
      responder.sendObject(collections);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }

  public static async fetchCollection(
    dataStore: DataStore,
    responder: Responder,
    name: string
  ) {
    try {
      let collection = await dataStore.fetchCollection(name);
      responder.sendObject(collection);
    } catch (e) {
      responder.sendOperationError(e);
    }
  }
}
