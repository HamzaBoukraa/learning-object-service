import { DataStore } from '../shared/interfaces/DataStore';
import {
  FileManager,
  LibraryCommunicator,
} from '../shared/interfaces/interfaces';
import { generatePDF } from './PDFKitDriver';
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
  hasLearningObjectWriteAccess,
  authorizeReadAccess,
  authorizeWriteAccess,
} from '../shared/AuthorizationManager';
import { FileMeta, LearningObjectFilter, MaterialsFilter } from './typings';
import * as PublishingService from './Publishing';
import { mapLearningObjectToSummary } from '../shared/functions';
import { FileMetadata } from '../FileMetadata';

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
      // Infer if this Learning Object is being released
      if (cleanUpdates.status === LearningObject.Status.RELEASED) {
        const releasableObject = await generateReleasableLearningObject(
          dataStore,
          id,
        );
        await PublishingService.releaseLearningObject({
          userToken,
          dataStore,
          releasableObject,
        });
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
 * FIXME: Once the return type of `fetchLearningObject` is updated to the `Datastore's` schema type,
 * this function should be updated to not fetch children ids as they should be returned with the document
 */
async function generateReleasableLearningObject(
  dataStore: DataStore,
  id: string,
) {
  const [object, childIds] = await Promise.all([
    dataStore.fetchLearningObject({ id, full: true }),
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
        FileMetadata.getAllFileMetadata({
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
    children.map(async child => {
      child.materials.files = await FileMetadata.getAllFileMetadata({
        requester,
        learningObjectId: parentId,
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
      await FileMetadata.deleteAllFileMetadata({
        requester: params.user,
        learningObjectId: object.id,
      }).catch(reportError);
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
      const workingFiles$ = FileMetadata.getAllFileMetadata({
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
