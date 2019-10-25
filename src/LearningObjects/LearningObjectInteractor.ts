import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import {
  LearningObjectMetadataUpdates,
  LearningObjectState,
  LearningObjectSummary,
  UserToken,
  VALID_LEARNING_OBJECT_UPDATES,
} from '../shared/types';
import {
  handleError,
  ResourceError,
  ResourceErrorReason,
  ServiceError,
} from '../shared/errors';
import { reportError } from '../shared/SentryConnector';
import { LearningObject, User } from '../shared/entity';
import {
  authorizeReadAccess,
  authorizeRequest,
  authorizeWriteAccess,
  requesterIsEditor,
  hasReadAccessByCollection,
  requesterIsAdminOrEditor,
  requesterIsAuthor,
} from '../shared/AuthorizationManager';
import {
  LearningObjectFilter,
  MaterialsFilter,
  HierarchicalLearningObject,
} from './typings';
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
import { LearningObjectSubmissionAdapter } from '../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { UserGateway } from './interfaces/UserGateway';
import { validateUpdates } from '../shared/entity/learning-object/validators';
import { UserServiceGateway } from '../shared/gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '../shared/MongoDB/HelperFunctions';
import { deleteSubmission } from '../LearningObjectSubmission/interactors/deleteSubmission';
import { LearningObjectSubmissionGateway } from './interfaces/LearningObjectSubmissionGateway';

import { learningObjectHasRevision } from '../shared/MongoDB/HelperFunctions/learningObjectHasRevision/learningObjectHasRevision';
const GATEWAY_API = process.env.GATEWAY_API;

namespace Drivers {
  export const readMeBuilder = () =>
    LearningObjectsModule.resolveDependency(ReadMeBuilder);
}
namespace Gateways {
  export const fileManager = () =>
    LearningObjectsModule.resolveDependency(FileManagerGateway);
  export const fileMetadata = () =>
    LearningObjectsModule.resolveDependency(FileMetadataGateway);
  export const user = () =>
    LearningObjectsModule.resolveDependency(UserGateway);
  export const submission = () =>
    LearningObjectsModule.resolveDependency(LearningObjectSubmissionGateway);
}


/**
 * Retrieve a Learning Object by CUID
 *
 * This function returns all versions of the Learning Object that the requester is authorized to read.
 *
 * @export
 * @param {{
 *   dataStore: DataStore,
 *   requester: UserToken,
 *   authorUsername: string,
 *   cuid: string,
 *   version?: number,
 * }}
 * @returns
 */
export async function getLearningObjectByCuid({
  dataStore,
  requester,
  cuid,
  version,
}: {
  dataStore: DataStore;
  requester: UserToken;
  authorUsername: string;
  cuid: string;
  version?: number;
}) {
  const objects = await dataStore.fetchLearningObjectByCuid(cuid, version);
  let unauthorized: boolean;

  const payload = objects.filter(object => {
    // this function will throw a ResourceError if requester isn't authorized
    try {
      authorizeReadAccess({ learningObject: object, requester });
      return true;
    } catch (e) {
      unauthorized = true;
      return false;
    }
  });

  if (!payload.length && unauthorized) {
    throw new ResourceError(`User: ${requester.username} does not have permission to view Learning Object with CUID: \`${cuid}\``, ResourceErrorReason.FORBIDDEN);
  } else if (!payload.length) {
    throw new ResourceError(`No Learning Object with CUID \`${cuid}\` and version \`${version}\` exists.`, ResourceErrorReason.NOT_FOUND);
  }

  return payload;
}

/**
 * Retrieve a Learning Object by CUID
 *
 * This function returns all versions of the Learning Object that the requester is authorized to read.
 *
 * @export
 * @param {{
 *   dataStore: DataStore,
 *   requester: UserToken,
 *   authorUsername: string,
 *   cuid: string,
 *   version?: number,
 * }}
 * @returns
 */
export async function getInternalLearningObjectByCuid({
  dataStore,
  requester,
  cuid,
  version,
}: {
  dataStore: DataStore;
  requester: UserToken;
  authorUsername: string;
  cuid: string;
  version?: number;
}) {
  const objects = await dataStore.fetchInternalLearningObjectByCuid(cuid, version);
  let unauthorized: boolean;

  const payload = objects.filter(object => {
    // this function will throw a ResourceError if requester isn't authorized
    try {
      authorizeReadAccess({ learningObject: object, requester });
      return true;
    } catch (e) {
      unauthorized = true;
      return false;
    }
  });

  if (!payload.length && unauthorized) {
    throw new ResourceError(`User: ${requester.username} does not have permission to view Learning Object with CUID: \`${cuid}\``, ResourceErrorReason.FORBIDDEN);
  } else if (!payload.length) {
    throw new ResourceError(`No Learning Object with CUID \`${cuid}\` and version \`${version}\` exists.`, ResourceErrorReason.NOT_FOUND);
  }

  return payload;
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
  const authorId = await UserServiceGateway.getInstance().findUser(username);
  if (!authorId) {
    throw new ResourceError(
      `No user with username ${username} exists`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  return authorId;
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
 * Retrieves Learning Object revision by id and version number
 *
 * The working copy can only be returned if
 * The requester is the author
 * The requester is a reviewer/curator@<Learning Object's collection> && the Learning Object is not unreleased
 * The requester is an admin/editor && the Learning Object is not unreleased
 *
 * @export
 * @param {DataStore} dataStore [Driver for datastore]
 * @param {UserToken} requester [Object containing information about the requester]
 * @param {string} learningObjectId [Id of the Learning Object]
 * @param {number} version [Version number of the Learning Object]
 * @param {string} username [Username of the Learning Object author]
 * @param {boolean} summary [Boolean indicating whether or not to return a LearningObject or LearningObjectSummary]
 * @returns {Promise<LearningObject | LearningObjectSummary>}
 */
export async function getLearningObjectRevision({
  dataStore,
  requester,
  learningObjectId,
  version,
  username,
  summary,
}: {
  dataStore: DataStore;
  requester: UserToken;
  learningObjectId: string;
  version: number;
  username: string;
  summary?: boolean;
}): Promise<LearningObject | LearningObjectSummary> {
  try {
    if (version === 0) {
      throw new ResourceError(
        `Cannot find revision ${version} for Learning Object ${learningObjectId}`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    await validateRequest({
      username: username,
      learningObjectId: learningObjectId,
      dataStore: dataStore,
    });

    let learningObject: LearningObject | LearningObjectSummary;
    let author: User;

    if (!summary) {
      author = await Gateways.user().getUser(username);
    }
    learningObject = await dataStore.fetchLearningObjectRevision({
      id: learningObjectId,
      version: version,
      author,
    });
    if (!learningObject) {
      throw new ResourceError(
        `Cannot find revision ${version} of Learning Object ${learningObjectId}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    const releasedAccess =
      learningObject.status === LearningObject.Status.RELEASED;
    const authorAccess = requesterIsAuthor({
      requester,
      authorUsername: learningObject.author.username,
    });
    const isUnreleased = LearningObjectState.UNRELEASED.includes(
      learningObject.status as LearningObject.Status,
    );
    const reviewerCuratorAccess =
      !isUnreleased &&
      hasReadAccessByCollection({
        requester,
        collection: learningObject.collection,
      });
    const adminEditorAccess =
      !isUnreleased && requesterIsAdminOrEditor(requester);
    authorizeRequest([
      releasedAccess,
      authorAccess,
      reviewerCuratorAccess,
      adminEditorAccess,
    ]);
    return learningObject;
  } catch (e) {
    handleError(e);
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
    const authorID = await UserServiceGateway.getInstance().findUser(
      authorUsername,
    );
    const author = await UserServiceGateway.getInstance().queryUserById(
      authorID,
    );
    const objectInsert = new LearningObject({
      ...object,
      author,
    });

    objectInsert.generateCUID();

    objectInsert.version = 0;

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
  library,
  requester,
  id,
  authorUsername,
  updates,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator,
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

    if (!learningObject) {
      throw new ResourceError(
        `No Learning Object with id ${id} exists.`,
        ResourceErrorReason.BAD_REQUEST,
      );
    }

    const isInReview = LearningObjectState.IN_REVIEW.includes(
      learningObject.status,
    );
    authorizeWriteAccess({
      learningObject,
      requester,
      message: `Invalid access. Cannot update Learning Object ${learningObject.id}.`,
    });

    const cleanUpdates = sanitizeUpdates(updates);
    validateUpdates(cleanUpdates);

    cleanUpdates.date = Date.now().toString();

    await dataStore.editLearningObject({
      id,
      updates: cleanUpdates,
    });

    // if updates include a name change and the object has been submitted, update the README
    if (updates.name && isInReview) {
      await updateReadme({
        dataStore,
        requester,
        id: learningObject.id,
      });
    }

    if (isInReview) {
      LearningObjectSubmissionAdapter.getInstance().applySubmissionUpdates({
        learningObjectId: id,
        updates: cleanUpdates,
        user: requester,
      });
    }

    // Infer if this Learning Object is being released
    if (cleanUpdates.status === LearningObject.Status.RELEASED) {
      const releasableObject = await generateReleasableLearningObject({
        dataStore,
        id,
        requester,
      });

      await PublishingService.releaseLearningObject({
        authorUsername,
        userToken: requester,
        dataStore,
        releasableObject,
      });

      if (releasableObject.version) {
        // this Learning Object must have a duplicate with a lower revision property
        await deleteDuplicateResources(dataStore, library, releasableObject.cuid, releasableObject.version, requester);

        // @ts-ignore isRevision isn't a valid property of LearningObject and is only used in the database for indexing purposes but needs to be flipped here
        await dataStore.editLearningObject({id, updates:  { isRevision: false } });
      }
    }

  } catch (e) {
    handleError(e);
  }
}

async function deleteDuplicateResources(dataStore: DataStore, library: LibraryCommunicator, cuid: string, currentVersion: any, requester: UserToken) {
  // delete the original Learning Object
  const objectsForCuid = await dataStore.fetchInternalLearningObjectByCuid(cuid);
  const outOfDateObject: LearningObject = objectsForCuid.filter(x => x.version !== currentVersion)[0]; // the array returned by .filter should always be of length 1

  // delete the out-of-date Learning Object
  await deleteLearningObject({ dataStore, library, id: outOfDateObject.id, requester });
}

/**
 * Generates a full releasable Learning Object including full metadata for all materials and children
 *
 * @param {DataStore} dataStore [The datastore to use to fetch the Learning Object data]
 * @param {string} id [The id of the Learning Object to get releasable copy of]
 * @param {UserToken} requester [The requester of the releasable Learning Object]
 * @returns {Promise<LearningObject>}
 */
export async function generateReleasableLearningObject({
  dataStore,
  id,
  requester,
}: {
  dataStore: DataStore;
  id: string;
  requester: UserToken;
}): Promise<HierarchicalLearningObject> {
  const [object, children] = await Promise.all([
    dataStore.fetchLearningObject({ id, full: true }),
    loadWorkingParentsReleasedChildObjects({
      dataStore,
      parentId: id,
    }),
  ]);
  object.materials.files = await Gateways.fileMetadata().getAllFileMetadata({
    requester,
    learningObjectId: object.id,
  });
  const releasableObject = new LearningObject({
    ...object.toPlainObject(),
  }) as HierarchicalLearningObject;
  releasableObject.children = children;
  return releasableObject;
}

/**
 * Fetches a learning object by id
 * If no filter is defined the released object is returned by default unless no released object exists
 * If no released object exists and no filter is specified, the unreleased object is loaded if the requester has access
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
  requester?: UserToken;
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
        full: false,
      });
      if (learningObject) {
        let files: LearningObject.Material.File[] = [];
        authorizeReadAccess({ requester, learningObject });
        files = await Gateways.fileMetadata().getAllFileMetadata({
          requester,
          learningObjectId: id,
        });
        learningObject.materials.files = files;
      }
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
        }),
      ]);
      learningObject.materials.files = files;
      loadingReleased = false;
    }
    if (!learningObject) {
      throw learningObjectNotFound;
    }

    learningObject.attachResourceUris(GATEWAY_API);
    const hasRevision = await mongoHelperFunctions.learningObjectHasRevision(learningObject.cuid, learningObject.id);
    if (hasRevision) {
      learningObject.attachRevisionUri();
    }

    return learningObject;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Fetches a Learning Object's summary by id
 * If no filter is defined the released object is returned by default unless no released object exists
 * If no released object exists and no filter is specified, the unreleased object is loaded if the reuqester has access
 *
 * If neither object is found, NotFound ResourceError is thrown
 *
 * @export
 * @param {DataStore} dataStore
 * @param {string} id the Learning Object's id
 * @returns {Promise<LearningObjectSummary>}
 */
export async function getLearningObjectSummaryById({
  dataStore,
  id,
  requester,
  filter,
}: {
  dataStore: DataStore;
  id: string;
  requester?: UserToken;
  filter?: LearningObjectFilter;
}): Promise<LearningObjectSummary> {
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
        full: false,
      });
    }
    if ((!learningObject && filter !== 'released') || filter === 'unreleased') {
      learningObject = await dataStore.fetchLearningObject({
        id,
        full: false,
      });
      authorizeReadAccess({
        requester,
        learningObject,
      });
      loadingReleased = false;
    }
    if (learningObject) {
      const hasRevision = await mongoHelperFunctions.learningObjectHasRevision(learningObject.cuid, learningObject.id);
      if (hasRevision) {
       learningObject.attachRevisionUri();
      }
      learningObject.attachResourceUris(GATEWAY_API);
    } else {
      throw learningObjectNotFound;
    }
    return mapLearningObjectToSummary(learningObject);
  } catch (e) {
    console.log(e);
    handleError(e);
  }
}

/**
 * Recursively loads all levels of full released child Learning Objects for an working parent Learning Object
 *
 * @param {DataStore} dataStore [The datastore to fetch children from]
 * @param {string} parentId [The id of the working parent Learning Object]
 *
 * @returns
 */
async function loadWorkingParentsReleasedChildObjects({
  dataStore,
  parentId,
}: {
  dataStore: DataStore;
  parentId: string;
}): Promise<HierarchicalLearningObject[]> {
  let children = await dataStore.loadWorkingParentsReleasedChildObjects({
    id: parentId,
  });

  return Promise.all(
    children.map(async (child: HierarchicalLearningObject) => {
      child.children = await loadWorkingParentsReleasedChildObjects({
        dataStore,
        parentId: child.id,
      });
      return child;
    }),
  );
}

/**
 * Fetches a learning object from the objects collection and performs read access authorization
 * for internal use.
 * @param {string} id the Learning Object's id
 * @param {DataStore} dataStore
 * @param {UserToken} requester [Information about the user making the delete request]
 *
 */
export async function getLearningObjectSummary({
  id,
  dataStore,
  requester,
}: {
  id: string;
  dataStore: DataStore;
  requester: UserToken;
}): Promise<LearningObjectSummary> {
  const learningObject = await dataStore.fetchLearningObject({ id });
  const learningObjectNotFound = new ResourceError(
    `No Learning Object ${id} exists.`,
    ResourceErrorReason.NOT_FOUND,
  );
  if (!learningObject) {
    throw learningObjectNotFound;
  }
  if (learningObject.status !== LearningObject.Status.RELEASED) {
    authorizeReadAccess({ learningObject, requester });
  }

  return mapLearningObjectToSummary(learningObject);
}

/**
 * Recursively loads all levels of full released child Learning Objects for a released parent Learning Object
 *
 * @param {DataStore} dataStore [The datastore to fetch children from]
 * @param {string} parentId [The id of the released parent Learning Object]
 *
 * @returns
 */
async function loadReleasedChildObjects({
  parentId,
}: {
  parentId: string;
}): Promise<HierarchicalLearningObject[]> {
  let children = (await mongoHelperFunctions.loadReleasedChildObjects({
    id: parentId,
    full: true,
  })) as HierarchicalLearningObject[];

  children = await Promise.all(
    children.map(async child => {
      child.children = await loadReleasedChildObjects({
        parentId: child.id,
      });
      return child;
    }),
  );
  return children;
}

/**
 * Fetches a learning objects children by ID
 *
 * Authorization is performed by first requesting the source object with a call to getLearningObjectsById()
 *
 * @export
 * @param {DataStore} dataStore
 * @param {string} id the learning object's id
 *
 * @returns { Promise<LearningObject[]> }
 *
 * @throws { ResourceError }
 */
export async function getLearningObjectChildrenSummariesById(
  dataStore: DataStore,
  requester: UserToken,
  libraryDriver: LibraryCommunicator,
  objectId: string,
): Promise<LearningObjectSummary[]> {
  try {
    // handle authorization by attempting to retrieve and read the source object
    await getLearningObjectSummaryById({
      dataStore,
      id: objectId,
      requester,
    });
  } catch (error) {
    if (error instanceof ResourceError) {
      if (error.name === ResourceErrorReason.NOT_FOUND) {
        throw new ResourceError(
          `Children for the Learning Object with id ${objectId} cannot be found because no Learning Object with id ${objectId} exists.`,
          ResourceErrorReason.NOT_FOUND,
        );
      }
    } else {
      throw error;
    }
  }

  // retrieve the ids of the children in the order in which they were set by user
  const childrenIDs = await dataStore.findChildObjectIds({
    parentId: objectId,
  });

  const childrenOrder = await mongoHelperFunctions.loadChildObjects({
    id: objectId,
    status: LearningObjectState.ALL,
  });

  // FIXME: simplify this step if possible
  // array to return the children in correct order
  const children: LearningObjectSummary[] = [];

  // fill children array with correct order of children
  let cIDs = 0;
  let c = 0;

  // order the children payload to the same order as the array of child ids stored in `childrenIDs`
  while (c < childrenOrder.length) {
    if (childrenIDs[cIDs] === childrenOrder[c].id) {
      childrenOrder[c].attachResourceUris(GATEWAY_API);
      const hasRevision = await mongoHelperFunctions.learningObjectHasRevision(childrenOrder[c].cuid, childrenOrder[c].id);
      if (hasRevision) {
        childrenOrder[c].attachRevisionUri();
      }
      children.push(mapLearningObjectToSummary(childrenOrder[c]));
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
    await Gateways.fileMetadata().deleteAllFileMetadata({
      requester,
      learningObjectId: learningObject.id,
    });
    await Gateways.submission().deletePreviousRelease({ learningObjectId: learningObject.id });
    await dataStore.deleteLearningObject(learningObject.id);
    dataStore
      .deleteChangelog({ learningObjectId: learningObject.id })
      .catch(e => {
        reportError(
          new Error(
            `Problem deleting changelogs for Learning Object${learningObject.id}: ${e}`,
          ),
        );
      });
  } catch (e) {
    handleError(e);
  }
}
/**
 * Deletes a Learning Object and all associated resources by cuid and version
 *
 * @export
 * @param {DataStore} datastore [The datastore to delete the Learning Object from]
 * @param {LibraryCommunicator} library [The library communicator to use to remove Learning Objects on delete]
 * @param {UserToken} requester [Information about the user making the delete request]
 * @param {string} id [The id of the Learning Object to be deleted]
 * @returns {Promise<void>}
 */
export async function deleteLearningObjectByCuidVersion({
  dataStore,
  cuid,
  version,
  library,
  user,
}: {
  dataStore: DataStore;
  cuid: string;
  version: number;
  library: LibraryCommunicator;
  user: UserToken;
}): Promise<void> {
  try {
    const authorId = await UserServiceGateway.getInstance().findUser(
      user.username,
    );
    if (!authorId) {
      throw new ResourceError(
        `Unable to delete Learning Object ${cuid}. No user ${user.username} with Learning Object ${cuid} version ${version} found.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    const objectId = await dataStore.findLearningObject({
      authorId,
      cuid,
      version,
    });
    if (!objectId) {
      throw new ResourceError(
        `Unable to delete Learning Object ${cuid}. No Learning Object ${cuid} version ${version} exists.`,
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
  requester: UserToken;
  object?: LearningObject;
  id?: string;
}): Promise<void> {
  try {
    let object = params.object;
    const id = params.id;
    if (!object && id) {
      let files: LearningObject.Material.File[] = [];
      [object, files] = await Promise.all([
        params.dataStore.fetchLearningObject({ id, full: true }),
        Gateways.fileMetadata().getAllFileMetadata({
          requester: params.requester,
          learningObjectId: id,
        }),
      ]);
      object.materials.files = files;
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
      learningObjectCUID: object.cuid,
      version: object.version,
      file: { data: pdfFile, path: newPdfName },
    });
    if (oldPDF && oldPDF.name !== newPdfName) {
      Gateways.fileManager()
        .deleteFile({
          authorUsername: object.author.username,
          learningObjectCUID: object.cuid,
          version: object.version,
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
}: {
  dataStore: DataStore;
  id: string;
  requester: UserToken;
}) {
  try {
    let materials: LearningObject.Material;
    let files: LearningObject.Material.File[];
    const learningObject = await dataStore.fetchLearningObject({
      id,
      full: false,
    });
    if (!learningObject) {
      throw new ResourceError(
        `Learning Object with id ${id} not Found`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    authorizeReadAccess({ learningObject, requester });
    const materials$ = dataStore.getLearningObjectMaterials({ id });
    const files$ = Gateways.fileMetadata().getAllFileMetadata({
      requester,
      learningObjectId: id,
    });
    [materials, files] = await Promise.all([materials$, files$]);
    if (!materials) {
      throw new ResourceError(
        `No materials exists for Learning Object ${id}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    if (files) {
      materials.files = files;
    } else {
      materials.files = materials.files.map(
        appendFilePreviewUrls(learningObject),
      );
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
 * that the requester is the Learning Object author. It is
 * also used to increment the revision property of the
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
  username: string;
  learningObjectId: string;
  dataStore: DataStore;
  requester: UserToken;
}): Promise<void> {
  await validateRequest({
    username: params.username,
    learningObjectId: params.learningObjectId,
    dataStore: params.dataStore,
  });

  const releasedCopy = await getReleasedLearningObjectSummary({
    dataStore: params.dataStore,
    id: params.learningObjectId,
  });

  if (!releasedCopy) {
    throw new ResourceError(
      `Cannot create a revision of Learning Object: ${params.learningObjectId} since it is not released.`,
      ResourceErrorReason.BAD_REQUEST,
    );
  }

  if (
    !requesterIsAuthor({
      authorUsername: releasedCopy.author.username,
      requester: params.requester,
    })
  ) {
    throw new ResourceError(
      `Cannot create a revision. Requester ${params.requester.username} must be the author of Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  releasedCopy.version++;

  await params.dataStore.editLearningObject({
    id: params.learningObjectId,
    updates: {
      version: releasedCopy.version,
      status: LearningObject.Status.UNRELEASED,
    },
  });
}

/** Appends file preview urls
 *
 * @param {LearningObject} learningObject
 * @returns {(
 *   value: LearningObject.Material.File,
 *   index: number,
 *   array: LearningObject.Material.File[],
 * ) => LearningObject.Material.File}
 */
function appendFilePreviewUrls(
  learningObject: LearningObject,
): (
  value: LearningObject.Material.File,
  index: number,
  array: LearningObject.Material.File[],
) => LearningObject.Material.File {
  return file => {
    file.previewUrl = Gateways.fileMetadata().getFilePreviewUrl({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.id,
      file,
      unreleased: learningObject.status !== LearningObject.Status.RELEASED,
    });
    return file;
  };
}

/**
 * Sanitizes object containing updates to be stored by removing invalid update properties, cloning valid properties, and trimming strings,
 * then validating the updates after they have been properly formatted
 *
 * @param {Partial<LearningObject>} object [Object containing values to update existing Learning Object with]
 * @returns {LearningObjectMetadataUpdates}
 */
function sanitizeUpdates(
  object: Partial<LearningObject>,
): LearningObjectMetadataUpdates {
  delete object.id;
  const updates: LearningObjectMetadataUpdates = {};
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
  username: string;
  learningObjectId: string;
  dataStore: DataStore;
}): Promise<void> {
  const learningObject = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
  });

  if (!learningObject) {
    throw new ResourceError(
      `Learning Object with id ${params.learningObjectId} does not exist`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  if (learningObject.author.username !== params.username) {
    throw new ResourceError(
      `User ${params.username} does not own a Learning Object with id ${params.learningObjectId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
}

/**
 * Checks if user has a Learning Object with a particular name
 *
 * @param {DataStore} dataStore [The datastore to check for existing Learning Object in]
 * @param {string} username [The Learning Object's author's username]
 * @param {string} name [The name of the Learning Object]
 * @param {string} id [The id of the Learning Object. If passed, the existing Learning Object found must match this value]
 * @param {string} version [The version of the learning object, if passed, the existing learning object found must amtch the version]
 *
 */
async function checkNameExists({
  dataStore,
  username,
  name,
  id,
  version,
}: {
  dataStore: DataStore;
  username: string;
  name: string;
  id?: string;
  version?: number;
}) {
  const authorId = await UserServiceGateway.getInstance().findUser(username);
  const existing = await dataStore.findLearningObjectByName({ authorId, name, version });
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
