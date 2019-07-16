import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import {
  LearningObjectUpdates,
  UserToken,
  VALID_LEARNING_OBJECT_UPDATES,
  LearningObjectSummary,
} from '../shared/types';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { reportError } from '../shared/SentryConnector';
import { LearningObject } from '../shared/entity';
import { handleError } from '../interactors/LearningObjectInteractor';
import {
  authorizeRequest,
  requesterIsAuthor,
  requesterIsAdminOrEditor,
  hasReadAccessByCollection,
  authorizeReadAccess,
  authorizeWriteAccess,
} from '../shared/AuthorizationManager';
import { FileMeta, LearningObjectFilter, MaterialsFilter } from './typings';
import * as PublishingService from './Publishing';
import {
  mapLearningObjectToSummary,
  sanitizeLearningObjectName,
} from '../shared/functions';
import {
  FileMetadataGateway,
  FileManagerGateway,
  ReadMeBuilder,
} from './interfaces';
import { LearningObjectsModule } from './LearningObjectsModule';

namespace Drivers {
  export const readMeBuilder = () =>
    LearningObjectsModule.resolveDependency(ReadMeBuilder);
}
namespace Gateways {
  export const fileManager = () =>
    LearningObjectsModule.resolveDependency(FileManagerGateway);
  export const fileMetadata = () =>
    LearningObjectsModule.resolveDependency(FileMetadataGateway);
}

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
 * Load a full learning object by name
 * @async
 *
 *
 * @param dataStore [The datastore to fetch the Learning Object from]
 * @param library [The library communicator used to fetch metrics about the Learning Object]
 * @param username [The username of the Learning Object's author]
 * @param learningObjectName [The name of the Learning Object]
 * @param userToken [Information about the requester of the Learning Object]
 *
 * @returns {LearningObject}
 */
export async function getLearningObjectByName({
  dataStore,
  library,
  username,
  learningObjectName,
  userToken,
  revision,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
  username: string;
  learningObjectName: string;
  userToken: UserToken;
  revision?: boolean;
}): Promise<LearningObject> {
  try {
    let learningObject: LearningObject;
    if (!revision) {
      learningObject = await loadReleasedLearningObjectByAuthorAndName({
        dataStore,
        library,
        authorUsername: username,
        learningObjectName,
      }).catch(error =>
        bypassNotFoundResourceError({
          error,
        }),
      );
    }
    if (revision || !learningObject) {
      learningObject = await loadLearningObjectByNameByAuthorAndName({
        dataStore,
        library,
        authorUsername: username,
        learningObjectName,
        userToken,
      });
    }

    return learningObject;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Loads working copy of a Learning Object by author's username and Learning Object's name
 *
 * @private
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     authorUsername: string;
 *     learningObjectName: string;
 *     userToken: UserToken;
 *   }} params
 * @returns
 * @memberof LearningObjectInteractor
 */
async function loadLearningObjectByNameByAuthorAndName({
  dataStore,
  library,
  authorUsername,
  learningObjectName,
  userToken,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
  authorUsername: string;
  learningObjectName: string;
  userToken: UserToken;
}) {
  const authorId = await findAuthorIdByUsername({
    dataStore,
    username: authorUsername,
  });
  const learningObjectID = await getLearningObjectIdByAuthorAndName({
    dataStore,
    authorId,
    authorUsername,
    name: learningObjectName,
  });
  return getLearningObjectById({
    dataStore,
    library,
    id: learningObjectID,
    requester: userToken,
    filter: 'unreleased',
  });
}

/**
 * Finds author's id by username.
 * If id is not found a ResourceError is thrown
 *
 * @private
 * @param {{
 *     dataStore: DataStore;
 *     username: string;
 *   }} params
 * @returns {Promise<string>}
 * @memberof LearningObjectInteractor
 */
async function findAuthorIdByUsername(params: {
  dataStore: DataStore;
  username: string;
}): Promise<string> {
  const { dataStore, username } = params;
  const authorId = await dataStore.findUser(username);
  if (!authorId) {
    throw new ResourceError(
      `No user with username ${username} exists`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  return authorId;
}

/**
 * Finds Learning Object's id by name and authorID.
 * If id is not found a ResourceError is thrown
 *
 * @private
 * @param {{
 *     dataStore: DataStore;
 *     name: string; [Learning Object's name]
 *     authorId: string [Learning Object's author's id]
 *     authorUsername: string [Learning Object's author's username]
 *   }} params
 * @returns {Promise<string>}
 * @memberof LearningObjectInteractor
 */
async function getLearningObjectIdByAuthorAndName(params: {
  dataStore: DataStore;
  name: string;
  authorId: string;
  authorUsername: string;
}): Promise<string> {
  const { dataStore, name, authorId, authorUsername } = params;
  const learningObjectId = await dataStore.findLearningObject({
    authorId,
    name,
  });
  if (!learningObjectId) {
    throw new ResourceError(
      `No Learning Object with name ${name} by ${authorUsername} exists`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
  return learningObjectId;
}

/**
 * Loads released Learning Object by author's id and Learning Object's name
 *
 * @private
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     authorId: string;
 *     authorUsername: string;
 *     learningObjectName: string;
 *   }} params
 * @returns
 * @memberof LearningObjectInteractor
 */
async function loadReleasedLearningObjectByAuthorAndName({
  dataStore,
  library,
  authorUsername,
  learningObjectName,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
  authorUsername: string;
  learningObjectName: string;
}) {
  const authorId = await findAuthorIdByUsername({
    dataStore,
    username: authorUsername,
  });
  const learningObjectID = await getReleasedLearningObjectIdByAuthorAndName({
    dataStore,
    authorId,
    authorUsername,
    name: learningObjectName,
  });
  return getLearningObjectById({
    dataStore,
    library,
    id: learningObjectID,
    requester: null,
    filter: 'released',
  });
}

/**
 * Finds released Learning Object's id by name and authorID.
 * If id is not found a ResourceError is thrown
 *
 * @private
 * @param {{
 *     dataStore: DataStore;
 *     name: string; [Learning Object's name]
 *     authorId: string [Learning Object's author's id]
 *     authorUsername: string [Learning Object's author's username]
 *   }} params
 * @returns {Promise<string>}
 * @memberof LearningObjectInteractor
 */
async function getReleasedLearningObjectIdByAuthorAndName(params: {
  dataStore: DataStore;
  name: string;
  authorId: string;
  authorUsername: string;
}): Promise<string> {
  const { dataStore, name, authorId, authorUsername } = params;
  const learningObjectId = await dataStore.findReleasedLearningObject({
    authorId,
    name,
  });
  if (!learningObjectId) {
    throw new ResourceError(
      `No released Learning Object with name ${name} by ${authorUsername} exists`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
  return learningObjectId;
}

/**
 * Retrieves released file metadata by id
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {string} id [Id of the Learning Object]
 * @param {string} fileId [Id of the file]
 * @returns {Promise<LearningObject.Material.File>}
 */
export async function getReleasedFile({
  dataStore,
  id,
  fileId,
}: {
  dataStore: DataStore;
  id: string;
  fileId: string;
}): Promise<LearningObject.Material.File> {
  try {
    const file = await dataStore.fetchReleasedFile({ id, fileId });
    if (!file) {
      throw new ResourceError(
        `Requested file ${fileId} for Learning Object ${id} cannot be found.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    return file;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves all released file metadata for a Learning Object
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {string} id [Id of the Learning Object]
 * @returns {Promise<LearningObject.Material.File[]>}
 */
export async function getReleasedFiles({
  dataStore,
  id,
}: {
  dataStore: DataStore;
  id: string;
}): Promise<LearningObject.Material.File[]> {
  try {
    const files = await dataStore.fetchReleasedFiles(id);
    if (!files) {
      throw new ResourceError(
        `No files found for Learning Object ${id}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    return files;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves a summary of the working copy Learning Object
 *
 * The working copy can only be returned if
 * The requester is the author
 * The requester is a reviewer/curator@<Learning Object's collection> && the Learning Object is not unreleased
 * The requester is an admin/editor && the Learning Object is not unreleased
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} id [Id of the Learning Object]
 * @returns {Promise<LearningObjectSummary>}
 */
export async function getWorkingLearningObjectSummary({
  dataStore,
  requester,
  id,
}: {
  dataStore: DataStore;
  requester: UserToken;
  id: string;
}): Promise<LearningObjectSummary> {
  try {
    const object = await dataStore.fetchLearningObject({ id, full: false });
    if (!object) {
      throw new ResourceError(
        `Learning Object ${id} does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    const authorAccess = requesterIsAuthor({
      requester,
      authorUsername: object.author.username,
    });
    const isUnreleased = LearningObjectState.UNRELEASED.includes(
      object.status as LearningObject.Status,
    );
    const reviewerCuratorAccess =
      !isUnreleased &&
      hasReadAccessByCollection({
        requester,
        collection: object.collection,
      });
    const adminEditorAccess =
      !isUnreleased && requesterIsAdminOrEditor(requester);
    authorizeRequest([authorAccess, reviewerCuratorAccess, adminEditorAccess]);
    return mapLearningObjectToSummary(object);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves a summary of the released copy Learning Object
 *
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {string} id [Id of the Learning Object]
 * @returns {Promise<LearningObjectSummary>}
 */
export async function getReleasedLearningObjectSummary({
  dataStore,
  id,
}: {
  dataStore: DataStore;
  id: string;
}): Promise<LearningObjectSummary> {
  try {
    const object = await dataStore.fetchReleasedLearningObject({
      id,
      full: false,
    });
    if (!object) {
      throw new ResourceError(
        `Learning Object ${id} does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    return mapLearningObjectToSummary(object);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves the Learning Object copy that is furthest along in the review pipeline
 *
 * The working copy can only be returned if
 * The requester is the author
 * The requester is a reviewer/curator@<Learning Object's collection> && the Learning Object is not unreleased
 * The requester is an admin/editor && the Learning Object is not unreleased
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} id [Id of the Learning Object]
 * @returns {Promise<LearningObjectSummary>}
 */
export async function getActiveLearningObjectSummary({
  dataStore,
  requester,
  id,
}: {
  dataStore: DataStore;
  requester: UserToken;
  id: string;
}): Promise<LearningObjectSummary> {
  try {
    const object =
      (await dataStore.fetchReleasedLearningObject({
        id,
      })) || (await dataStore.fetchLearningObject({ id, full: false }));
    if (!object) {
      throw new ResourceError(
        `Learning Object ${id} does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    const releasedAccess = object.status === LearningObject.Status.RELEASED;
    const authorAccess = requesterIsAuthor({
      requester,
      authorUsername: object.author.username,
    });
    const isUnreleased = LearningObjectState.UNRELEASED.includes(
      object.status as LearningObject.Status,
    );
    const reviewerCuratorAccess =
      !isUnreleased &&
      hasReadAccessByCollection({
        requester,
        collection: object.collection,
      });
    const adminEditorAccess =
      !isUnreleased && requesterIsAdminOrEditor(requester);
    authorizeRequest([
      releasedAccess,
      authorAccess,
      reviewerCuratorAccess,
      adminEditorAccess,
    ]);
    return mapLearningObjectToSummary(object);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves Learning Object summary by id and revision number
 *
 * The working copy can only be returned if
 * The requester is the author
 * The requester is a reviewer/curator@<Learning Object's collection> && the Learning Object is not unreleased
 * The requester is an admin/editor && the Learning Object is not unreleased
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} id [Id of the Learning Object]
 * @param {number} revision [Revision number of the Learning Object]
 * @returns {Promise<LearningObjectSummary>}
 */
export async function getLearningObjectRevisionSummary({
  dataStore,
  requester,
  id,
  revision,
}: {
  dataStore: DataStore;
  requester: UserToken;
  id: string;
  revision: number;
}): Promise<LearningObjectSummary> {
  try {
    const object = await dataStore.fetchLearningObjectRevisionSummary({
      id,
      revision,
    });
    if (!object) {
      throw new ResourceError(
        `Cannot find revision ${revision} of Learning Object ${id}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    const releasedAccess = object.status === LearningObject.Status.RELEASED;
    const authorAccess = requesterIsAuthor({
      requester,
      authorUsername: object.author.username,
    });
    const isUnreleased = LearningObjectState.UNRELEASED.includes(
      object.status as LearningObject.Status,
    );
    const reviewerCuratorAccess =
      !isUnreleased &&
      hasReadAccessByCollection({
        requester,
        collection: object.collection,
      });
    const adminEditorAccess =
      !isUnreleased && requesterIsAdminOrEditor(requester);
    authorizeRequest([
      releasedAccess,
      authorAccess,
      reviewerCuratorAccess,
      adminEditorAccess,
    ]);
    return object;
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
 * @param {DataStore} dataStore [The datastore to add the Learning Object to]
 * @param {Partial<LearningObject>} object [Learning Object data to be inserted]
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {UserToken} requester [Information about the user making the request to add a Learning Object]
 *
 * @returns {LearningObject} The full Learning Object
 */
export async function addLearningObject({
  dataStore,
  object,
  authorUsername,
  requester,
}: {
  dataStore: DataStore;
  object: Partial<LearningObject>;
  authorUsername: string;
  requester: UserToken;
}): Promise<LearningObject> {
  try {
    await authorizeRequest(
      [requesterIsAuthor({ authorUsername, requester })],
      'Invalid access. Learning Objects cannot be created for another user.',
    );
    await checkNameExists({
      dataStore,
      username: authorUsername,
      name: object.name,
    });
    const authorID = await dataStore.findUser(authorUsername);
    const author = await dataStore.fetchUser(authorID);
    const objectInsert = new LearningObject({
      ...object,
      author,
    });
    objectInsert.revision = 0;
    const learningObjectID = await dataStore.insertLearningObject(objectInsert);
    objectInsert.id = learningObjectID;
    return objectInsert;
  } catch (e) {
    handleError(e);
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
export async function updateLearningObject({
  dataStore,
  requester,
  id,
  authorUsername,
  updates,
}: {
  dataStore: DataStore;
  requester: UserToken;
  id: string;
  authorUsername: string;
  updates: Partial<LearningObject>;
}): Promise<void> {
  try {
    if (updates.name) {
      await checkNameExists({
        id,
        dataStore,
        name: updates.name,
        username: authorUsername,
      });
    }
    const learningObject = await dataStore.fetchLearningObject({
      id,
      full: false,
    });
    authorizeWriteAccess({
      learningObject,
      requester,
      message: `Invalid access. Cannot update Learning Object ${
        learningObject.id
      }.`,
    });
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
    // Infer if this Learning Object is being released
    if (cleanUpdates.status === LearningObject.Status.RELEASED) {
      const releasableObject = await generateReleasableLearningObject({
        dataStore,
        id,
        requester,
      });
      await PublishingService.releaseLearningObject({
        userToken: requester,
        dataStore,
        releasableObject,
      });
    }
  } catch (e) {
    handleError(e);
  }
}

/**
 * FIXME: Once the return type of `fetchLearningObject` is updated to the `Datastore's` schema type,
 * this function should be updated to not fetch children ids as they should be returned with the document
 */
async function generateReleasableLearningObject({
  dataStore,
  id,
  requester,
}: {
  dataStore: DataStore;
  id: string;
  requester: UserToken;
}) {
  const [object, childIds, files] = await Promise.all([
    dataStore.fetchLearningObject({ id, full: true }),
    dataStore.findChildObjectIds({ parentId: id }),
    Gateways.fileMetadata().getAllFileMetadata({
      requester,
      learningObjectId: id,
      filter: 'unreleased',
    }),
  ]);
  let children: LearningObject[] = [];
  if (Array.isArray(childIds)) {
    children = childIds.map(childId => new LearningObject({ id: childId }));
  }
  const releasableObject = new LearningObject({
    ...object.toPlainObject(),
    children,
  });
  releasableObject.materials.files = files;
  return releasableObject;
}

/**
 * Fetches a learning object by id
 * If no filter is defined the released object is returned by default unless no released object exists
 * If no released object exists and no filter is specified, the unreleased object is loaded if the reuqester has access
 *
 * If neither object is found, NotFound ResourceError is thrown
 *
 * @export
 * @param {DataStore} dataStore
 * @param {string} id the learning object's id
 * @returns {Promise<LearningObject>}
 */
export async function getLearningObjectById({
  dataStore,
  library,
  id,
  requester,
  filter,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
  id: string;
  requester: UserToken;
  filter?: LearningObjectFilter;
}): Promise<LearningObject> {
  try {
    let learningObject: LearningObject;
    let loadingReleased = true;
    const learningObjectNotFound = new ResourceError(
      `No Learning Object ${id} exists.`,
      ResourceErrorReason.NOT_FOUND,
    );
    if (!filter || filter === 'released') {
      learningObject = await dataStore.fetchReleasedLearningObject({
        id,
        full: true,
      });
    }
    if ((!learningObject && filter !== 'released') || filter === 'unreleased') {
      let files: LearningObject.Material.File[] = [];
      const learningObjectSummary = await dataStore.fetchLearningObject({
        id,
        full: false,
      });
      if (!learningObjectSummary) {
        throw learningObjectNotFound;
      }
      authorizeReadAccess({ requester, learningObject: learningObjectSummary });
      [learningObject, files] = await Promise.all([
        dataStore.fetchLearningObject({ id, full: true }),
        Gateways.fileMetadata().getAllFileMetadata({
          requester,
          learningObjectId: id,
          filter: 'unreleased',
        }),
      ]);
      learningObject.materials.files = files;
      loadingReleased = false;
    }
    if (!learningObject) {
      throw learningObjectNotFound;
    }
    let children: LearningObject[] = [];
    if (loadingReleased) {
      children = await dataStore.loadReleasedChildObjects({
        id: learningObject.id,
        full: false,
      });
      // FIXME: Children should be mapped to LearningObjectSummary type which doesn't include materials
      children = await Promise.all(
        children.map(async child => {
          child.materials = await dataStore.fetchReleasedMaterials(child.id);
          return child;
        }),
      );
    } else {
      const childrenStatus = requesterIsAuthor({
        requester,
        authorUsername: learningObject.author.username,
      })
        ? LearningObjectState.ALL
        : LearningObjectState.IN_REVIEW;

      children = await loadChildObjectSummaries({
        parentId: learningObject.id,
        dataStore,
        childrenStatus,
        requester,
      });
    }

    learningObject.children = children;

    learningObject.metrics = await loadMetrics({
      library,
      id: learningObject.id,
    }).catch(e => {
      reportError(e);
      return { saves: 0, downloads: 0 };
    });
    return learningObject;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Loads unreleased child object summaries
 *
 * @param {DataStore} dataStore [The datastore to fetch children from]
 * @param {string} parentId [The id of the parent Learning Object]
 * @param {LearningObject.Status[]} status [The statuses the children should match]
 * @param {UserToken} requester [Information about the requester used to authorize the request]
 *
 * @returns
 */
async function loadChildObjectSummaries({
  dataStore,
  parentId,
  childrenStatus,
  requester,
}: {
  dataStore: DataStore;
  parentId: string;
  childrenStatus: LearningObject.Status[];
  requester: UserToken;
}) {
  let children = await dataStore.loadChildObjects({
    id: parentId,
    full: false,
    status: childrenStatus,
  });
  children = await Promise.all(
    // FIXME: Children should be mapped to LearningObjectSummary type which doesn't include materials or files
    children.map(async child => {
      child.materials = await dataStore.getLearningObjectMaterials({
        id: child.id,
      });
      child.materials.files = await Gateways.fileMetadata().getAllFileMetadata({
        requester,
        learningObjectId: child.id,
        filter: 'unreleased',
      });
      return child;
    }),
  );
  return children;
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

/**
 * Deletes a Learning Object and all associated resources
 *
 * @export
 * @param {DataStore} datastore [The datastore to delete the Learning Object from]
 * @param {LibraryCommunicator} library [The library communicator to use to remove Learning Objects on delete]
 * @param {UserToken} requester [Information about the user making the delete request]
 * @param {string} id [The id of the Learning Object to be deleted]
 * @returns {Promise<void>}
 */
export async function deleteLearningObject({
  dataStore,
  library,
  requester,
  id,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
  requester: UserToken;
  id: string;
}): Promise<void> {
  try {
    const learningObject = await dataStore.fetchLearningObject({
      id,
      full: false,
    });
    if (!learningObject) {
      throw new ResourceError(
        `Cannot delete Learning Object ${id}. Learning Object does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    authorizeWriteAccess({ learningObject, requester });
    await library.cleanObjectsFromLibraries([learningObject.id]);
    await Gateways.fileMetadata().deleteAllFileMetadata({
      requester,
      learningObjectId: learningObject.id,
    });
    await dataStore.deleteLearningObject(learningObject.id);
    dataStore
      .deleteChangelog({ learningObjectId: learningObject.id })
      .catch(e => {
        reportError(
          new Error(
            `Problem deleting changelogs for Learning Object${
              learningObject.id
            }: ${e}`,
          ),
        );
      });
  } catch (e) {
    handleError(e);
  }
}
/**
 * Deletes a Learning Object and all associated resources by name
 *
 * @export
 * @param {DataStore} datastore [The datastore to delete the Learning Object from]
 * @param {LibraryCommunicator} library [The library communicator to use to remove Learning Objects on delete]
 * @param {UserToken} requester [Information about the user making the delete request]
 * @param {string} id [The id of the Learning Object to be deleted]
 * @returns {Promise<void>}
 */
export async function deleteLearningObjectByName({
  dataStore,
  learningObjectName,
  library,
  user,
}: {
  dataStore: DataStore;
  learningObjectName: string;
  library: LibraryCommunicator;
  user: UserToken;
}): Promise<void> {
  try {
    const authorId = await dataStore.findUser(user.username);
    if (!authorId) {
      throw new ResourceError(
        `Unable to delete Learning Object ${learningObjectName}. No user ${
          user.username
        } with Learning Object ${learningObjectName} found.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    const objectId = await dataStore.findLearningObject({
      authorId,
      name: learningObjectName,
    });
    if (!objectId) {
      throw new ResourceError(
        `Unable to delete Learning Object ${learningObjectName}. No Learning Object ${learningObjectName} exists.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    const object = await dataStore.fetchLearningObject({
      id: objectId,
      full: false,
    });

    authorizeWriteAccess({
      learningObject: object,
      requester: user,
      message: `Unable to delete Learning Object ${objectId}.`,
    });

    await library.cleanObjectsFromLibraries([object.id]);
    await Gateways.fileMetadata().deleteAllFileMetadata({
      requester: user,
      learningObjectId: object.id,
    });
    await dataStore.deleteLearningObject(object.id);
    dataStore.deleteChangelog({ learningObjectId: object.id }).catch(e => {
      reportError(
        new Error(
          `Problem deleting changelogs for Learning Object ${object.id}: ${e}`,
        ),
      );
    });
  } catch (e) {
    handleError(e);
  }
}

/**
 * Updates Readme PDF for Learning Object
 *
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     object?: LearningObject;
 *     id?: string;
 *   }} params
 * @returns {Promise<LearningObject>}
 * @memberof LearningObjectInteractor
 */
export async function updateReadme(params: {
  dataStore: DataStore;
  object?: LearningObject;
  id?: string;
}): Promise<void> {
  try {
    let object = params.object;
    const id = params.id;
    if (!object && id) {
      object = await params.dataStore.fetchLearningObject({ id, full: true });
    } else if (!object && !id) {
      throw new ResourceError(
        `No learning object or id provided.`,
        ResourceErrorReason.BAD_REQUEST,
      );
    }
    const oldPDF: LearningObject.Material.PDF = object.materials['pdf'];

    const pdfFile = await Drivers.readMeBuilder().buildReadMe(object);
    const newPdfName: string = `0ReadMeFirst - ${sanitizeLearningObjectName(
      object.name,
    )}.pdf`;

    await Gateways.fileManager().uploadFile({
      authorUsername: object.author.username,
      learningObjectId: object.id,
      file: { data: pdfFile, path: newPdfName },
    });
    if (oldPDF && oldPDF.name !== newPdfName) {
      Gateways.fileManager()
        .deleteFile({
          authorUsername: object.author.username,
          learningObjectId: object.id,
          path: oldPDF.name,
        })
        .catch(reportError);
    }

    return await params.dataStore.editLearningObject({
      id: object.id,
      updates: {
        'materials.pdf': {
          name: newPdfName,
        },
      },
    });
  } catch (e) {
    handleError(e);
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
export async function getMaterials({
  dataStore,
  id,
  requester,
  filter,
}: {
  dataStore: DataStore;
  id: string;
  requester: UserToken;
  filter?: MaterialsFilter;
}) {
  try {
    let materials: LearningObject.Material;
    let workingFiles: LearningObject.Material.File[];
    if (filter === 'unreleased') {
      const learningObject = await dataStore.fetchLearningObject({
        id,
        full: false,
      });
      authorizeReadAccess({ learningObject, requester });
      const materials$ = dataStore.getLearningObjectMaterials({ id });
      const workingFiles$ = Gateways.fileMetadata().getAllFileMetadata({
        requester,
        learningObjectId: id,
        filter: 'unreleased',
      });
      [materials, workingFiles] = await Promise.all([
        materials$,
        workingFiles$,
      ]);
    } else {
      materials = await dataStore.fetchReleasedMaterials(id);
    }

    if (!materials) {
      throw new ResourceError(
        `No materials exists for Learning Object ${id}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    if (workingFiles) {
      materials.files = workingFiles;
    }

    return materials;
  } catch (e) {
    handleError(e);
  }
}

/**
 * createLearningObjectRevision is responsible
 * for orchestrating the creation of a Learning
 * Object revision. The function starts by validating
 * the request structure. This is done by calling the
 * validateRequest function, which ensures that
 * the given userId and learningObjectId pair produce
 * a Learning Object. After the request is validated,
 * the function retrieves the Released Copy of the
 * Learning Object. If the Released Copy of the
 * Learning Object is not found, the function throws a
 * Resource Error. The Released Copy is used to validate
 * that the reqeuster is the Learning Object author. It is
 * also ussed to increment the revision property of the
 * Working Copy. The function ends by updating the Working
 * Copy to have a revision that is one greater than the Released Copy
 * revision and a status of unreleased.
 *
 * @param {
 *  userId string
 *  learningObjectId string
 *  dataStore DataStore
 *  requester UserToken
 * }
 */
export async function createLearningObjectRevision(params: {
  userId: string,
  learningObjectId: string,
  dataStore: DataStore,
  requester: UserToken,
}): Promise<void> {
  await validateRequest({
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    dataStore: params.dataStore,
  });

  const releasedCopy = await getReleasedLearningObjectSummary({
    dataStore: params.dataStore,
    id: params.learningObjectId,
  });

  if (!releasedCopy) {
    throw new ResourceError(
      `Learning Object with id ${params.learningObjectId} is not released`,
      ResourceErrorReason.CONFLICT,
    );
  }

  if (releasedCopy.author.username !== params.requester.username) {
    throw new ResourceError(
      `Requester ${params.requester.username} does not own Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  await updateLearningObject({
    dataStore: params.dataStore,
    requester: params.requester,
    id: params.learningObjectId,
    authorUsername: releasedCopy.author.username,
    updates: {
      revision: releasedCopy.revision++,
      status: LearningObject.Status.UNRELEASED,
    },
  });
}

/**
 * Sanitizes object containing updates to be stored by removing invalid update properties, cloning valid properties, and trimming strings
 *
 * @param {Partial<LearningObject>} object [Object containing values to update existing Learning Object with]
 * @returns {LearningObjectUpdates}
 */
function sanitizeUpdates(
  object: Partial<LearningObject>,
): LearningObjectUpdates {
  delete object.id;
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
 * validateRequest tries to find a Learning Object
 * with the given userId and Learning Object Id.
 * If it does not find a Learning Object that matches
 * the given criteria, it throws a Resource Error.
 * @param params
 */
async function validateRequest(params: {
  userId: string,
  learningObjectId: string,
  dataStore: DataStore,
}): Promise<void> {
  const learningObject = await params.dataStore.checkLearningObjectExistence({
    userId: params.userId,
    learningObjectId: params.learningObjectId,
  });

  if (!learningObject) {
    throw new ResourceError(
      `User ${params.userId} does not own a Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
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
 * Checks if user has a Learning Object with a particular name
 *
 * @param {DataStore} dataStore [The datastore to check for existing Learning Object in]
 * @param {string} username [The Learning Object's author's username]
 * @param {string} name [The name of the Learning Object]
 * @param {string} id [The id of the Learning Object. If passed, the existing Learning Object found must match this value]
 *
 */
async function checkNameExists({
  dataStore,
  username,
  name,
  id,
}: {
  dataStore: DataStore;
  username: string;
  name: string;
  id?: string;
}) {
  const authorId = await dataStore.findUser(username);
  const existing = await dataStore.findLearningObject({ authorId, name });
  if (existing && id !== existing) {
    throw new ResourceError(
      `A Learning Object with name '${name}' already exists. Learning Objects you author must have unique names.`,
      ResourceErrorReason.CONFLICT,
    );
  }
}

/**
 * Fetches Metrics for Learning Object
 *
 * @param library the gateway to library data
 * @param {string} id [Id of the Learning Object to load metrics for]
 * @returns {Promise<LearningObject.Metrics>}
 */
function loadMetrics({
  library,
  id,
}: {
  library: LibraryCommunicator;
  id: string;
}): Promise<LearningObject.Metrics> {
  return library.getMetrics(id);
}

/**
 * This handler allows execution to proceed if a ResourceError occurs because of a resource not being found.
 *
 * @param {Error} error
 * @returns {null} [Returns null so that the value resolves to null indicating resource was not loaded]
 */
function bypassNotFoundResourceError({
  error,
}: {
  error: Error;
}): null | never {
  if (
    !(error instanceof ResourceError) ||
    (error instanceof ResourceError &&
      error.name !== ResourceErrorReason.NOT_FOUND)
  ) {
    throw error;
  }
  return null;
}
