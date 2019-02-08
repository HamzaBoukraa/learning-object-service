import { LearningObject } from '@cyber4all/clark-entity';
import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { generatePDF } from './PDFKitDriver';
import {
  LearningObjectUpdates,
  UserToken,
  VALID_LEARNING_OBJECT_UPDATES,
} from '../types';
import { LearningObjectError } from '../errors';
import { hasLearningObjectWriteAccess } from '../interactors/AuthorizationManager';
import { reportError } from '../drivers/SentryConnector';

/**
 * Performs update operation on learning object's date
 *
 * @param {{
 *   dataStore: DataStore;
 *   id: string; [Id of the LearningObject being updated]
 *   date?: string; [Timestamp to replace LearningObjects' current date with]
 * }} params
 */
export async function updateObjectLastModifiedDate(params: {
  dataStore: DataStore;
  id: string;
  date?: string;
}): Promise<void> {
  const lastModified = params.date || Date.now().toString();
  await params.dataStore.editLearningObject({
    id: params.id,
    updates: { date: lastModified },
  });
  return updateParentsDate({
    dataStore: params.dataStore,
    childId: params.id,
    date: lastModified,
  });
}

/**
 * Recursively updates parent objects' dates
 *
 * @param {{
 *   dataStore: DataStore;
 *   childId: string; [Id of child LearningObject]
 *   parentIds?: string[]; [Ids of parent LearningObjects]
 *   date: string; [Timestamp to replace LearningObjects' current date with]
 * }} params
 * @returns {Promise<void>}
 */
export async function updateParentsDate(params: {
  dataStore: DataStore;
  childId: string;
  parentIds?: string[];
  date: string;
}): Promise<void> {
  let { dataStore, childId, parentIds, date } = params;
  if (parentIds == null) {
    parentIds = await params.dataStore.findParentObjectIds({
      childId,
    });
  }

  if (parentIds && parentIds.length) {
    await Promise.all([
      // Perform update of all parent dates
      dataStore.updateMultipleLearningObjects({
        ids: parentIds,
        updates: { date },
      }),
      // Perform update of each object's parents' dates
      ...parentIds.map(id =>
        updateParentsDate({
          dataStore,
          date,
          childId: id,
        }),
      ),
    ]);
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
export async function addLearningObject(
  dataStore: DataStore,
  object: LearningObject,
  user: UserToken,
): Promise<LearningObject> {
  const err = LearningObjectInteractor.validateLearningObject(object);

  await checkNameExists({
    dataStore,
    username: user.username,
    name: object.name,
  });

  try {
    if (err) {
      return Promise.reject(err);
    } else {
      const authorID = await dataStore.findUser(user.username);
      const author = await dataStore.fetchUser(authorID);
      if (!author.emailVerified) {
        object.unpublish();
      }
      object.lock = {
        restrictions: [LearningObject.Restriction.DOWNLOAD],
      };
      const objectInsert = new LearningObject({
        ...object.toPlainObject(),
        author,
      });
      const learningObjectID = await dataStore.insertLearningObject(
        objectInsert,
      );
      objectInsert.id = learningObjectID;
      return objectInsert;
    }
  } catch (e) {
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
  id: string;
  updates: { [index: string]: any };
}): Promise<void> {
  if (params.updates.id) {
    delete params.updates.id;
  }

  if (params.updates.name) {
    await checkNameExists({
      id: params.id,
      dataStore: params.dataStore,
      name: params.updates.name,
      username: params.user.username,
    });
  }
  try {
      const hasAccess = await hasLearningObjectWriteAccess(params.user, params.dataStore, params.id);
      if (hasAccess) {
          const updates: LearningObjectUpdates = sanitizeUpdates(params.updates);
          validateUpdates({
            id: params.id,
            updates,
          });
          updates.date = Date.now().toString();
          await params.dataStore.editLearningObject({
            id: params.id,
            updates,
          });
      } else {
        return Promise.reject(new Error('User does not have authorization to perform this action'));
      }
    } catch (e) {
      reportError(e);
      return Promise.reject(new Error(`Problem updating learning object ${params.id}. ${e}`));
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

export async function deleteLearningObject(params: {
  dataStore: DataStore,
  fileManager: FileManager,
  learningObjectName: string,
  library: LibraryCommunicator,
  user: UserToken,
}): Promise<void> {
  try {
    const hasAccess = await hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectName);
    if (hasAccess) {
      const object = await params.dataStore.peek<{
        id: string;
      }>({
        query: { 'name': params.learningObjectName },
        fields: {},
      });
      await params.library.cleanObjectsFromLibraries([object.id]);
      await params.dataStore.deleteLearningObject(object.id);
      const path = `${params.user.username}/${object.id}/`;
      params.fileManager.deleteAll({ path }).catch(e => {
        reportError(
          new Error(`Problem deleting files for ${params.learningObjectName}: ${path}. ${e}`),
        );
      });
      params.dataStore.deleteChangelog(object.id).catch(e => {
        reportError(
          new Error(`Problem deleting changelogs for ${params.learningObjectName}: ${e}`),
        );
      });
    } else {
      return Promise.reject(new Error('User does not have authorization to perform this action'));
    }
  } catch (e) {
    reportError(e);
    return Promise.reject(new Error(`Problem deleting Learning Object. Error: ${e}`));
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
    const oldPDF: LearningObject.Material.PDF = object.materials['pdf'];
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
    await updateObjectLastModifiedDate({
      dataStore: params.dataStore,
      id: params.objectId,
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
      await deleteFile(params.fileManager, path);
      await updateObjectLastModifiedDate({
        dataStore: params.dataStore,
        id: params.objectId,
      });
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
async function deleteFile(
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
 * Fetches Learning Object's materials
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   id: string;
 * }} params
 * @returns
 */
export async function getMaterials(params: {
  dataStore: DataStore;
  id: string;
}) {
  try {
    return await params.dataStore.getLearningObjectMaterials({ id: params.id });
  } catch (e) {
    return Promise.reject(
      `Problem fetching materials for object: ${params.id}. Error: ${e}`,
    );
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
  id?: string;
}) {
  const authorId = await params.dataStore.findUser(params.username);
  const existing = await params.dataStore.peek<{ id: string }>({
    query: { authorID: authorId, name: params.name },
    fields: { id: 1 },
  });
  // @ts-ignore typescript doesn't think a .id property should exist on the existing object
  if (existing && params.id !== existing.id) {
    throw new Error(LearningObjectError.DUPLICATE_NAME(params.name));
  }
}

