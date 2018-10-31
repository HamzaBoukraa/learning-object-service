import { LearningObject } from '@cyber4all/clark-entity';
import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { generatePDF } from './PDFKitDriver';
import { LearningObjectPDF } from '@cyber4all/clark-entity/dist/learning-object';
import {
  LearningObjectUpdates,
  UserToken,
  VALID_LEARNING_OBJECT_UPDATES,
} from '../types';

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
      await updateReadme({
        fileManager,
        object,
        dataStore,
      });

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
export async function updateLearningObject(params: {
  user: UserToken;
  dataStore: DataStore;
  fileManager: FileManager;
  id: string;
  updates: { [index: string]: any };
}): Promise<void> {
  try {
    await checkAuthorization({
      dataStore: params.dataStore,
      user: params.user,
      objectId: params.id,
      requiredPermission: 'owner',
    });
    const updates: LearningObjectUpdates = sanitizeUpdates(params.updates);
    await validateUpdates({
      id: params.id,
      updates,
    });
    if (params.updates.name) {
      await checkNameExists({
        id: params.id,
        dataStore: params.dataStore,
        name: params.updates.name,
        username: params.user.username,
      });
    }
    updates.date = Date.now().toString();

    if (updates.description) {
      // @ts-ignore
      updates.goals = [{ text: updates.description }];
    }

    await params.dataStore.editLearningObject({
      id: params.id,
      updates,
    });

    await updateReadme({
      dataStore: params.dataStore,
      fileManager: params.fileManager,
      id: params.id,
    });
  } catch (e) {
    return Promise.reject(`Problem updating Learning Object. ${e}`);
  }
}

/**
 * Fetches a learning object by ID
 *
 * @export
 * @param {DataStore} dataStore
 * @param {string} id the learning object's id
 * @returns {Promise<LearningObject>}
 */
export async function getLearningObjectById(
  dataStore: DataStore,
  id: string,
): Promise<LearningObject> {
  try {
    return await dataStore.fetchLearningObject(id, true, true);
  } catch (e) {
    return Promise.reject(`Problem fetching Learning Object. ${e}`);
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
    if (learningObject.materials.files.length) {
      const path = `${username}/${learningObjectID}/`;
      await fileManager.deleteAll({ path });
    }
    library.cleanObjectsFromLibraries([learningObjectID]);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(`Problem deleting Learning Object. Error: ${error}`);
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
}): Promise<void> {
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
      const path = `${object.author.username}/${object.id}/${oldPDF.name}`;
      deleteFile(params.fileManager, path);
    }

    return await params.dataStore.editLearningObject({
      id: object.id,
      updates: {
        'materials.pdf': {
          name: pdf.name,
          url: pdf.url,
        },
      },
    });
  } catch (e) {
    return Promise.reject(
      `Problem updating Readme for learning object. Error: ${e}`,
    );
  }
}

/**
 * Updates file description
 *
 * @static
 * @param {string} objectId
 * @param {string} fileId
 * @returns {Promise<void>}
 * @memberof LearningObjectInteractor
 */
export async function updateFileDescription(params: {
  dataStore: DataStore;
  objectId: string;
  fileId: string;
  description: string;
}): Promise<void> {
  try {
    await params.dataStore.updateFileDescription({
      learningObjectId: params.objectId,
      fileId: params.fileId,
      description: params.description,
    });
  } catch (e) {
    return Promise.reject(`Problem updating file description. Error: ${e}`);
  }
}

/**
 * Removes file metadata and deletes from S3
 *
 * @static
 * @param {FileManager} fileManager
 * @param {string} id
 * @param {string} username
 * @param {string} filename
 * @returns {Promise<void>}
 * @memberof LearningObjectInteractor
 */
export async function removeFile(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  objectId: string;
  username: string;
  fileId: string;
}): Promise<void> {
  try {
    const file = await params.dataStore.findSingleFile({
      learningObjectId: params.objectId,
      fileId: params.fileId,
    });
    if (file) {
      const path = `${params.username}/${params.objectId}/${
        file.fullPath ? file.fullPath : file.name
      }`;
      await params.dataStore.removeFromFiles({
        objectId: params.objectId,
        fileId: params.fileId,
      });
      return await deleteFile(params.fileManager, path);
    }
  } catch (e) {
    return Promise.reject(`Problem deleting file. Error: ${e}`);
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
  path: string,
): Promise<void> {
  try {
    return fileManager.delete({ path });
  } catch (e) {
    return Promise.reject(`Problem deleting file. Error: ${e}`);
  }
}

/**
 * Checks to see if user has required permissions
 *
 * @param {({
 *     dataStore: DataStore;
 *     user: UserToken;
 *     objectId: string;
 *     requiredPermission: 'owner' | 'public';
 *   })} params
 * @param {boolean} [enforceAdminPrivileges=true]
 * @returns {Promise<void>}
 */
async function checkAuthorization(
  params: {
    dataStore: DataStore;
    user: UserToken;
    objectId: string;
    requiredPermission: 'owner' | 'public';
  },
  enforceAdminPrivileges = true,
): Promise<void> {
  if (params.user.accessGroups.includes('admin') && enforceAdminPrivileges) {
    return;
  }
  switch (params.requiredPermission) {
    case 'owner':
      const userId = await params.dataStore.findUser(params.user.name);
      const object = await params.dataStore.peek<{ authorID: string }>({
        query: { id: params.objectId },
        fields: { authorID: 1 },
      });
      if (userId !== object.authorID) {
        throw new Error(``);
      }
      break;
    case 'public':
      const publishedDoc = await params.dataStore.peek<{ published: boolean }>({
        query: { id: params.objectId },
        fields: { published: 1 },
      });
      if (!publishedDoc.published) {
        throw new Error(``);
      }
      break;
    default:
      break;
  }
}

/**
 * Sanitizes object containing updates to be stored by cloning valid properties and trimming strings
 *
 * @param {{
 *   [index: string]: any;
 * }} object
 * @returns {LearningObjectUpdates}
 */
function sanitizeUpdates(object: {
  [index: string]: any;
}): LearningObjectUpdates {
  const updates: LearningObjectUpdates = {};
  for (const key of VALID_LEARNING_OBJECT_UPDATES) {
    if (object[key]) {
      const value = object[key];
      updates[key] = typeof value === 'string' ? value.trim() : value;
    }
  }
  return updates;
}

/**
 * Verifies update object contains valid update values
 *
 * @param {{
 *   id: string;
 *   updates: LearningObjectUpdates;
 * }} params
 */
function validateUpdates(params: {
  id: string;
  updates: LearningObjectUpdates;
}): void {
  if (params.updates.name) {
    if (params.updates.name.trim() === '') {
      throw new Error('Learning Object name cannot be empty.');
    }
  }
}

/**
 * Checks if user has a learning object with a particular name
 *
 * @param {{
 *   dataStore: DataStore;
 *   username: string;
 *   name: string;
 * }} params
 */
async function checkNameExists(params: {
  dataStore: DataStore;
  username: string;
  name: string;
  id: string;
}) {
  const authorId = await params.dataStore.findUser(params.username);
  const existing = await params.dataStore.peek<{ id: string }>({
    query: { authorID: authorId, name: params.name },
    fields: { id: 1 },
  });
  // @ts-ignore typescript doesn't think a .id property should exist on the existing object
  if (existing && params.id !== existing.id) {
    throw new Error(
      `A learning object with name: ${params.name}, already exists.`,
    );
  }
}
