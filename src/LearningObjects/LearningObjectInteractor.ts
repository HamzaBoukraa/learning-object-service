import { LearningObject } from '@cyber4all/clark-entity';
import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { generatePDF } from './PDFKitDriver';
import { LearningObjectPDF } from '@cyber4all/clark-entity/dist/learning-object';

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
export async function addLearningObject(
  dataStore: DataStore,
  fileManager: FileManager,
  object: LearningObject,
): Promise<LearningObject> {
  try {
    const err = LearningObjectInteractor.validateLearningObject(object);
    if (err) {
      return Promise.reject(err);
    } else {
      const learningObjectID = await dataStore.insertLearningObject(object);
      object.id = learningObjectID;

      // Generate PDF and update Learning Object with PDF meta.
      object = await updateReadme({
        fileManager,
        object,
        dataStore,
      });
      updateLearningObject(dataStore, fileManager, object.id, object);

      return object;
    }
  } catch (e) {
    // The duplicate key error is produced by Mongo, via a constraint on the authorID/name compound index
    // FIXME: This should be an error that is encapsulated within the MongoDriver, since it is specific to Mongo's indexing functionality
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
export async function updateLearningObject(
  dataStore: DataStore,
  fileManager: FileManager,
  id: string,
  object: LearningObject,
): Promise<void> {
  try {
    const err = LearningObjectInteractor.validateLearningObject(object);
    if (!err) {
      object = await updateReadme({
        dataStore,
        fileManager,
        object,
      });
      return await dataStore.editLearningObject(id, object);
    } else {
      throw new Error(err);
    }
  } catch (e) {
    return Promise.reject(`Problem updating Learning Object. Error: ${e}`);
  }
}

export async function deleteLearningObject(
  dataStore: DataStore,
  fileManager: FileManager,
  username: string,
  learningObjectName: string,
  library: LibraryCommunicator,
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
    await dataStore.deleteChangelog(learningObjectID);
    if (learningObject.materials.files.length) {
      const path = `${username}/${learningObjectID}/`;
      await fileManager.deleteAll({ path });
    }
    library.cleanObjectsFromLibraries([learningObjectID]);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(
      `Problem deleting Learning Object. Error: ${error}`,
    );
  }
}

/**
 * Updates Readme PDF for Learning Object
 *
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     fileManager: FileManager;
 *     object?: LearningObject;
 *     id?: string;
 *   }} params
 * @returns {Promise<LearningObject>}
 * @memberof LearningObjectInteractor
 */
export async function updateReadme(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  object?: LearningObject;
  id?: string;
}): Promise<LearningObject> {
  try {
    let object = params.object;
    const id = params.id;
    if (!object && id) {
      object = await params.dataStore.fetchLearningObject(id, true, true);
    } else if (!object && !id) {
      throw new Error(`No learning object or id provided.`);
    }
    const oldPDF: LearningObjectPDF = object.materials['pdf'];
    const pdf = await generatePDF(params.fileManager, object);

    if (oldPDF && oldPDF.name !== pdf.name) {
      deleteFile(
        params.fileManager,
        object.id,
        object.author.username,
        oldPDF.name,
      );
    }

    object.materials['pdf'] = {
      name: pdf.name,
      url: pdf.url,
    };
    return object;
  } catch (e) {
    return Promise.reject(
      `Problem updating Readme for learning object. Error: ${e}`,
    );
  }
}

/**
 * Deletes specified file
 *
 * @static
 * @param {FileManager} fileManager
 * @param {string} id
 * @param {string} username
 * @param {string} filename
 * @returns {Promise<void>}
 * @memberof LearningObjectInteractor
 */
export async function deleteFile(
  fileManager: FileManager,
  id: string,
  username: string,
  filename: string,
): Promise<void> {
  try {
    const path = `${username}/${id}/${filename}`;
    return fileManager.delete({ path });
  } catch (e) {
    return Promise.reject(`Problem deleting file. Error: ${e}`);
  }
}
export async function getRecentChangelog(
  dataStore: DataStore,
  learningObjectId: String
): Promise<any> {
  try { 
    const changelog = await dataStore.fetchRecentChangelog(learningObjectId);
    return changelog;
  } catch (e) {
    return Promise.reject(`Problem fetching recent changelog for learning object: ` + learningObjectId + `. Error: ${e}`);
  }
}
