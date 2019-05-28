import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../shared/interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../shared/interfaces/interfaces';
import { generatePDF } from './PDFKitDriver';
import {
  LearningObjectUpdates,
  UserToken,
  VALID_LEARNING_OBJECT_UPDATES,
} from '../shared/types';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import {
  hasLearningObjectWriteAccess,
  isPrivilegedUser,
} from '../shared/AuthorizationManager';
import { reportError } from '../shared/SentryConnector';
import { LearningObject } from '../shared/entity';
import { handleError } from '../interactors/LearningObjectInteractor';
import {
  authorizeRequest,
  requesterIsAuthor,
  requesterIsAdminOrEditor,
} from './AuthorizationManager';
import { FileMeta } from './typings';

const LearningObjectState = {
  UNRELEASED: [
    LearningObject.Status.REJECTED,
    LearningObject.Status.UNRELEASED,
  ],
  IN_REVIEW: [
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
  ],
  RELEASED: [LearningObject.Status.RELEASED],
  ALL: [
    LearningObject.Status.REJECTED,
    LearningObject.Status.UNRELEASED,
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
    LearningObject.Status.RELEASED,
  ],
};

/**
 * Adds or updates Learning Object file metadata
 * *** Only the author of Learning Object, admins, and editors are allowed to add file metadata to a Learning Object ***
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} authorUsername [Learning Object's author's username]
 * @param {string} learningObjectId [Id of the Learning Object to add the file metadata to]
 * @param {FileMeta} fileMeta [Object containing metadata about the file]
 * @returns {Promise<string>} [Id of the added Learning Object file]
 */
export async function addLearningObjectFile({
  dataStore,
  requester,
  authorUsername,
  learningObjectId,
  fileMeta,
}: {
  dataStore: DataStore;
  requester: UserToken;
  authorUsername: string;
  learningObjectId: string;
  fileMeta: FileMeta;
}): Promise<string> {
  try {
    const isAuthor = requesterIsAuthor({ authorUsername, requester });
    const isAdminOrEditor = requesterIsAdminOrEditor(requester);
    authorizeRequest([isAuthor, isAdminOrEditor]);
    validateRequestParams({
      params: [fileMeta.name, fileMeta.url, fileMeta.size],
      mustProvide: ['name', 'url', 'size'],
    });
    const loFile: LearningObject.Material.File = generateLearningObjectFile(
      fileMeta,
    );
    const loFileId = await dataStore.addToFiles({
      loFile,
      id: learningObjectId,
    });
    updateObjectLastModifiedDate({ dataStore, id: learningObjectId });
    return loFileId;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Adds or updates Learning Object mutliple file metadata
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} authorUsername [Learning Object's author's username]
 * @param {string} learningObjectId [Id of the Learning Object to add the file metadata to]
 * @param {FileMeta[]} fileMeta [Object containing metadata about the file]
 * @returns {Promise<string[]>} [Ids of the added Learning Object files]
 */
export async function addLearningObjectFiles({
  dataStore,
  requester,
  authorUsername,
  learningObjectId,
  fileMeta,
}: {
  dataStore: DataStore;
  requester: UserToken;
  authorUsername: string;
  learningObjectId: string;
  fileMeta: FileMeta[];
}): Promise<string[]> {
  try {
    const promises$ = fileMeta.map(file => {
      return addLearningObjectFile({
        dataStore,
        authorUsername,
        learningObjectId,
        fileMeta: file,
        requester,
      });
    });
    return await Promise.all(promises$);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Generates new LearningObject.Material.File Object
 *
 * @private
 * @param {FileMeta} file
 * @param {string} url
 * @returns
 */
function generateLearningObjectFile(
  file: FileMeta,
): LearningObject.Material.File {
  const extension = file.name.split('.').pop();
  const fileType = file.fileType || '';
  const learningObjectFile: Partial<LearningObject.Material.File> = {
    extension,
    fileType,
    url: file.url,
    date: Date.now().toString(),
    name: file.name,
    fullPath: file.fullPath,
    size: +file.size,
    packageable: isPackageable(+file.size),
  };

  // Sanitize object. Remove undefined or null values
  const keys = Object.keys(learningObjectFile);
  for (const key of keys) {
    const prop = learningObjectFile[key];
    if (!prop && prop !== 0) {
      delete learningObjectFile[key];
    }
  }

  return learningObjectFile as LearningObject.Material.File;
}

// 100 MB in bytes; File size is in bytes
const MAX_PACKAGEABLE_FILE_SIZE = 100000000;
function isPackageable(size: number) {
  // if dztotalfilesize doesn't exist it must not be a chunk upload.
  // this means by default it must be a packageable file size
  return !(size > MAX_PACKAGEABLE_FILE_SIZE);
}

/**
 * Validates all required values are provided for request
 *
 * @param {any[]} params
 * @param {string[]} [mustProvide]
 * @returns {(void | never)}
 */
function validateRequestParams({
  params,
  mustProvide,
}: {
  params: any[];
  mustProvide?: string[];
}): void | never {
  const values = [...params].map(val => {
    if (typeof val === 'string') {
      val = val.trim();
    }
    return val;
  });
  if (
    values.includes(null) ||
    values.includes('null') ||
    values.includes(undefined) ||
    values.includes('undefined') ||
    values.includes('')
  ) {
    const multipleParams = mustProvide.length > 1;
    let message = 'Invalid parameters provided';
    if (Array.isArray(mustProvide)) {
      message = `Must provide ${multipleParams ? '' : 'a'} valid value${
        multipleParams ? 's' : ''
      } for ${mustProvide}`;
    }
    throw new ResourceError(message, ResourceErrorReason.BAD_REQUEST);
  }
}

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
  await checkNameExists({
    dataStore,
    username: user.username,
    name: object.name,
  });
  try {
    const authorID = await dataStore.findUser(user.username);
    const author = await dataStore.fetchUser(authorID);
    const objectInsert = new LearningObject({
      ...object.toPlainObject(),
      author,
    });
    const learningObjectID = await dataStore.insertLearningObject(objectInsert);
    objectInsert.id = learningObjectID;
    return objectInsert;
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
  userToken: UserToken;
  dataStore: DataStore;
  id: string;
  updates: { [index: string]: any };
}): Promise<void> {
  let { userToken, dataStore, id, updates } = params;
  if (updates.id) {
    delete updates.id;
  }

  if (updates.name) {
    await checkNameExists({
      id,
      dataStore,
      name: updates.name,
      username: userToken.username,
    });
  }
  try {
    const hasAccess = await hasLearningObjectWriteAccess(
      userToken,
      dataStore,
      id,
    );
    if (hasAccess) {
      const cleanUpdates = sanitizeUpdates(updates);
      validateUpdates({
        id,
        updates: cleanUpdates,
      });
      cleanUpdates.date = Date.now().toString();
      await dataStore.editLearningObject({
        id,
        updates: cleanUpdates,
      });
      if (
        isPrivilegedUser(userToken.accessGroups) &&
        cleanUpdates.status === LearningObject.Status.RELEASED
      ) {
        await releaseLearningObject({ dataStore, id });
      }
    } else {
      return Promise.reject(
        new ResourceError('Invalid Access', ResourceErrorReason.INVALID_ACCESS),
      );
    }
  } catch (e) {
    reportError(e);
    return Promise.reject(
      new Error(`Problem updating learning object ${params.id}. ${e}`),
    );
  }
}

/**
 * Releases a LearningObject by adding object to released collection of objects
 *
 * FIXME: Once the return type of `fetchLearningObject` is updated to the `Datastore's` schema type,
 * this function should be updated to not fetch children ids as they should be returned with the document
 *
 * @param {DataStore} datastore [Driver for the datastore]
 * @param {string} id [Id of the LearningObject to be copied]
 * @returns {Promise<void>}
 */
async function releaseLearningObject({
  dataStore,
  id,
}: {
  dataStore: DataStore;
  id: string;
}): Promise<void> {
  const [object, childIds] = await Promise.all([
    dataStore.fetchLearningObject({
      id,
      full: true,
    }),
    dataStore.findChildObjectIds({ parentId: id }),
  ]);
  let children: LearningObject[] = [];
  if (Array.isArray(childIds)) {
    children = childIds.map(childId => new LearningObject({ id: childId }));
  }
  const releasableObject = new LearningObject({
    ...object.toPlainObject(),
    children,
  });
  return dataStore.addToReleased(releasableObject);
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
    return await dataStore.fetchLearningObject({ id, full: true });
  } catch (e) {
    return Promise.reject(`Problem fetching Learning Object. ${e}`);
  }
}

/**
 * Fetches a learning objects children by ID
 *
 * @export
 * @param {DataStore} dataStore
 * @param {string} id the learning object's id
 */
export async function getLearningObjectChildrenById(
  dataStore: DataStore,
  objectId: string,
) {
  // Retrieve the ids of the children in the order in which they were set by user
  const childrenIDs = await dataStore.findChildObjectIds({
    parentId: objectId,
  });

  const childrenOrder = await dataStore.loadChildObjects({
    id: objectId,
    full: true,
    status: LearningObjectState.ALL,
  });
  // array to return the children in correct order
  const children: LearningObject[] = [];

  // fill children array with correct order of children
  let cIDs = 0;
  let c = 0;

  while (c < childrenOrder.length) {
    if (childrenIDs[cIDs] === childrenOrder[c].id) {
      children.push(childrenOrder[c]);
      cIDs++;
      c = 0;
    } else {
      c++;
    }
  }
  return children;
}

export async function deleteLearningObject(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  learningObjectName: string;
  library: LibraryCommunicator;
  user: UserToken;
}): Promise<void> {
  try {
    const hasAccess = await hasLearningObjectWriteAccess(
      params.user,
      params.dataStore,
      params.learningObjectName,
    );
    if (hasAccess) {
      const object = await params.dataStore.peek<{
        id: string;
      }>({
        query: { name: params.learningObjectName },
        fields: {},
      });
      await params.library.cleanObjectsFromLibraries([object.id]);
      await params.dataStore.deleteLearningObject(object.id);
      const path = `${params.user.username}/${object.id}/`;
      params.fileManager.deleteAll({ path }).catch(e => {
        reportError(
          new Error(
            `Problem deleting files for ${
            params.learningObjectName
            }: ${path}. ${e}`,
          ),
        );
      });
      params.dataStore
        .deleteChangelog({ learningObjectId: object.id })
        .catch(e => {
          reportError(
            new Error(
              `Problem deleting changelogs for ${
                params.learningObjectName
              }: ${e}`,
            ),
          );
        });
    } else {
      return Promise.reject(
        new Error('User does not have authorization to perform this action'),
      );
    }
  } catch (e) {
    reportError(e);
    return Promise.reject(
      new Error(`Problem deleting Learning Object. Error: ${e}`),
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
}): Promise<void> {
  try {
    let object = params.object;
    const id = params.id;
    if (!object && id) {
      object = await params.dataStore.fetchLearningObject({ id, full: true });
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
    throw new ResourceError(
      `A learning object with name '${params.name}' already exists.`,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}
