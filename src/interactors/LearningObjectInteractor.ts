// @ts-ignore
import * as stopword from 'stopword';
import { reportError } from '../shared/SentryConnector';
import { sanitizeObject, sanitizeText } from '../shared/functions';
import {
  LearningObjectQuery,
  QueryCondition,
} from '../shared/interfaces/DataStore';
import {
  DataStore,
  LibraryCommunicator,
} from '../shared/interfaces/interfaces';
import {
  updateObjectLastModifiedDate,
  updateParentsDate,
  getLearningObjectById,
} from '../LearningObjects/LearningObjectInteractor';
import { UserToken, ServiceToken } from '../shared/types';
import {
  getAccessGroupCollections,
  hasMultipleLearningObjectWriteAccesses,
  hasLearningObjectWriteAccess,
  requesterIsAdminOrEditor,
  requesterIsPrivileged,
  hasServiceLevelAccess,
  hasReadAccessByCollection,
  requesterIsAuthor,
} from '../shared/AuthorizationManager';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../shared/errors';
import { LearningObject } from '../shared/entity';
import { LearningObjectsModule } from '../LearningObjects/LearningObjectsModule';
import { FileMetadataGateway } from '../LearningObjects/interfaces';

namespace Gateways {
  export const fileMetadata = () =>
    LearningObjectsModule.resolveDependency(FileMetadataGateway);
}

export const LearningObjectState = {
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

interface CollectionAccessMap {
  [index: string]: string[];
}

export class LearningObjectInteractor {
  /**
   * Loads Learning Object summaries for a user, optionally applying a query for filtering and sorting.
   * @async
   *
   * @returns {LearningObject[]} the user's learning objects found by the query
   * @param params.dataStore
   * @param params.library
   * @param params.username
   * @param params.userToken
   * @param params.loadChildren
   * @param params.query
   */
  public static async loadUsersObjectSummaries(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    username: string;
    userToken: UserToken;
    loadChildren?: boolean;
    query?: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    const {
      dataStore,
      library,
      username,
      userToken,
      loadChildren,
      query,
    } = params;
    try {
      let summary: LearningObject[] = [];
      // tslint:disable-next-line: no-shadowed-variable
      const { dataStore, library, username, loadChildren, query } = params;

      const formattedQuery = this.formatSearchQuery(query);
      let { status, orderBy, sortType, text } = formattedQuery;

      // This will throw an error if there is no user with that username
      await dataStore.findUser(username);

      if (
        !this.hasReadAccess({
          userToken,
          resourceVal: params.username,
          authFunction: checkAuthByUsername,
        })
      ) {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }
      if (!status) {
        status = LearningObjectState.ALL;
      }

      const objectIDs = await dataStore.getUserObjects(username);
      summary = await dataStore.fetchMultipleObjects({
        ids: objectIDs,
        full: false,
        orderBy,
        sortType,
        status,
        text,
      });

      summary = await Promise.all(
        summary.map(async object => {
          // Load object metrics
          try {
            object.metrics = await this.loadMetrics(library, object.id);
          } catch (e) {
            reportError(e);
          }

          if (loadChildren) {
            const children = await this.loadChildObjects({
              dataStore,
              library,
              parentId: object.id,
              full: false,
              status: LearningObjectState.ALL,
              loadWorkingCopies: true,
            });
            children.forEach((child: LearningObject) => object.addChild(child));
          }

          return object;
        }),
      );
      return summary;
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Retrieve the objects on a user's profile based on the requester's access groups and priveleges
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     username: string;
   *     userToken?: UserToken;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  public static async loadProfile(params: {
    dataStore: DataStore;
    username: string;
    userToken?: UserToken;
  }): Promise<LearningObject[]> {
    const { dataStore, username, userToken } = params;
    // all users can see released objects from all collections
    let status: string[] = LearningObjectState.RELEASED;
    let collections;

    // if user is admin/editor/curator/review, also send waiting/review/proofing objects for collections they're privileged in
    if (userToken && requesterIsAdminOrEditor(userToken)) {
      status = status.concat(LearningObjectState.IN_REVIEW);
    } else if (userToken && requesterIsPrivileged(userToken)) {
      status = status.concat(LearningObjectState.IN_REVIEW);
      collections = getAccessGroupCollections(userToken);
    }

    const objectIDs = await dataStore.getUserObjects(username);
    const summaries = await dataStore.fetchMultipleObjects({
      ids: objectIDs,
      full: false,
      collections,
      status,
    });

    return summaries;
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
  private static async findAuthorIdByUsername(params: {
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
  private static async getLearningObjectIdByAuthorAndName(params: {
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
  private static async getReleasedLearningObjectIdByAuthorAndName(params: {
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
   * Runs through authorization logic read access to a learning object data.
   * Throws an error if requester is not authorized
   *
   * @private
   * @static
   * @param {{
   *     userToken: UserToken | ServiceToken; [The token of the requester]
   *     objectInfo: { author: string; status: string; collection: string };
   *   }} params
   * @memberof LearningObjectInteractor
   */
  private static authorizeReadAccess(params: {
    userToken: UserToken | ServiceToken;
    objectInfo: { author: string; status: string; collection: string };
  }): void {
    const { userToken, objectInfo } = params;
    const authorOnlyAccess = LearningObjectState.UNRELEASED.includes(
      objectInfo.status as LearningObject.Status,
    );

    const isAuthor = this.hasReadAccess({
      userToken: userToken as UserToken,
      resourceVal: objectInfo.author,
      authFunction: isAuthorByUsername,
    }) as boolean;

    const isService = hasServiceLevelAccess(userToken as ServiceToken);

    if (authorOnlyAccess && !isService && !isAuthor) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }
    const authorOrPrivilegedAccess = !LearningObjectState.RELEASED.includes(
      objectInfo.status as LearningObject.Status,
    );
    const isPrivileged = this.hasReadAccess({
      userToken: userToken as UserToken,
      resourceVal: objectInfo.collection,
      authFunction: checkCollectionReadAccess,
    }) as boolean;
    if (authorOrPrivilegedAccess && !isService && !isAuthor && !isPrivileged) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }
  }

  /**
   * Returns parent object's children
   *
   * @private
   * @static
   * @param {DataStore} dataStore
   * @param {LibraryCommunicator} library
   * @param {string} parentId
   * @param {boolean} [full]
   * @param {string[]} [status]
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  private static async loadChildObjects(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    parentId: string;
    full?: boolean;
    status: string[];
    loadWorkingCopies?: boolean;
  }): Promise<LearningObject[]> {
    const {
      dataStore,
      library,
      parentId,
      full,
      status,
      loadWorkingCopies,
    } = params;

    // Load Parent's children
    let objects;
    if (loadWorkingCopies) {
      objects = await dataStore.loadChildObjects({
        id: parentId,
        full,
        status,
      });
    } else {
      objects = await dataStore.loadReleasedChildObjects({
        id: parentId,
        full,
      });
    }

    // For each child object
    return Promise.all(
      objects.map(async obj => {
        // Load their children
        let children = await this.loadChildObjects({
          dataStore,
          library,
          parentId: obj.id,
          full,
          status,
          loadWorkingCopies,
        });
        // For each of the Child's children
        children = await Promise.all(
          children.map(async child => {
            // Load child metrics
            try {
              child.metrics = await this.loadMetrics(library, child.id);
            } catch (e) {
              reportError(e);
            }
            return child;
          }),
        );

        return new LearningObject({ ...obj.toPlainObject(), children });
      }),
    );
  }

  /**
   * Returns a Learning Object's Id by author's username and Learning Object's name
   * Will attempt to find released and unreleased object's id if authorized
   *
   * @static
   * @param {({
   *     dataStore: DataStore;
   *     username: string;
   *     learningObjectName: string;
   *     userToken: UserToken | ServiceToken;
   *   })} params
   * @returns {Promise<string>}
   * @memberof LearningObjectInteractor
   */
  public static async getLearningObjectId(params: {
    dataStore: DataStore;
    username: string;
    learningObjectName: string;
    userToken: UserToken | ServiceToken;
  }): Promise<string> {
    try {
      const { dataStore, username, learningObjectName, userToken } = params;

      const authorId = await this.findAuthorIdByUsername({
        dataStore,
        username,
      });

      const isAuthor = this.hasReadAccess({
        userToken: userToken as UserToken,
        resourceVal: username,
        authFunction: isAuthorByUsername,
      }) as boolean;
      const isPrivileged =
        userToken && requesterIsPrivileged(<UserToken>userToken);
      const isService = hasServiceLevelAccess(userToken as ServiceToken);
      const authorizationCases = [isAuthor, isPrivileged, isService];

      let learningObjectID = await this.getReleasedLearningObjectIdByAuthorAndName(
        {
          dataStore,
          authorId,
          authorUsername: username,
          name: learningObjectName,
        },
      ).catch(error =>
        bypassNotFoundResourceErrorIfAuthorized({ error, authorizationCases }),
      );

      if (!learningObjectID) {
        learningObjectID = await this.getLearningObjectIdByAuthorAndName({
          dataStore,
          authorId,
          authorUsername: username,
          name: learningObjectName,
        });
        const [status, collection] = await Promise.all([
          dataStore.fetchLearningObjectStatus(learningObjectID),
          dataStore.fetchLearningObjectCollection(learningObjectID),
        ]);
        this.authorizeReadAccess({
          userToken,
          objectInfo: { author: username, status, collection },
        });
      }
      return learningObjectID;
    } catch (e) {
      if (e instanceof ResourceError || e instanceof ServiceError) {
        return Promise.reject(e);
      }
      reportError(e);
      throw new ServiceError(ServiceErrorReason.INTERNAL);
    }
  }
  /**
   * Deletes multiple objects by author's name and Learning Objects' names
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     library: LibraryCommunicator;
   *     learningObjectNames: string[];
   *     user: UserToken;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async deleteMultipleLearningObjects({
    dataStore,
    library,
    learningObjectNames,
    user,
  }: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    learningObjectNames: string[];
    user: UserToken;
  }): Promise<void> {
    try {
      const hasAccess = await hasMultipleLearningObjectWriteAccesses(
        user,
        dataStore,
        learningObjectNames,
      );

      if (!hasAccess) {
        throw new ResourceError(
          'User does not have authorization to perform this action',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }

      // Get LearningObject ids
      const objectRefs: {
        id: string;
        parentIds: string[];
      }[] = await Promise.all(
        learningObjectNames.map(async (name: string) => {
          const authorId = await this.findAuthorIdByUsername({
            dataStore,
            username: user.username,
          });
          const id = await dataStore.findLearningObject({
            authorId,
            name,
          });
          const parentIds = await dataStore.findParentObjectIds({
            childId: id,
          });
          return { id, parentIds };
        }),
      );
      const objectIds = objectRefs.map(obj => obj.id);
      // Remove objects from library
      await library.cleanObjectsFromLibraries(objectIds);
      await Promise.all(
        objectRefs.map(ref =>
          Gateways.fileMetadata().deleteAllFileMetadata({
            requester: user,
            learningObjectId: ref.id,
          }),
        ),
      );
      // Delete objects from datastore
      await dataStore.deleteMultipleLearningObjects(objectIds);
      // For each object id
      objectRefs.forEach(async obj => {
        // Update parents' dates
        updateParentsDate({
          dataStore,
          parentIds: obj.parentIds,
          childId: obj.id,
          date: Date.now().toString(),
        });
      });
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Fetches objects by id
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     library: LibraryCommunicator;
   *     ids: string[];
   *     full?: boolean;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  public static async fetchObjectsByIDs(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    ids: string[];
    full?: boolean;
  }): Promise<LearningObject[]> {
    try {
      const { dataStore, library, ids, full } = params;
      let learningObjects = await dataStore.fetchMultipleObjects({
        ids,
        full,
        status: [
          ...LearningObjectState.IN_REVIEW,
          ...LearningObjectState.RELEASED,
        ],
      });

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            reportError(e);
            if (!full) {
              return object;
            }
          }
          if (full) {
            const children = await this.loadChildObjects({
              dataStore,
              library,
              parentId: object.id,
              full: true,
              status: [
                ...LearningObjectState.IN_REVIEW,
                ...LearningObjectState.RELEASED,
              ],
            });
            children.forEach((child: LearningObject) => object.addChild(child));
            return object;
          }
        }),
      );
      return learningObjects;
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Searches LearningObjects based on query
   *
   * @static
   * @param {DataStore} dataStore
   * @param {LibraryCommunicator} library
   * @param {LearningObjectQuery} query
   * @param {UserToken} userToken
   * @returns {Promise<{ total: number; objects: LearningObject[] }>}
   * @memberof LearningObjectInteractor
   */
  public static async searchObjects(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    query: LearningObjectQuery;
    userToken: UserToken;
  }): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      const { dataStore, library, query, userToken } = params;
      let {
        name,
        author,
        collection,
        length,
        level,
        guidelines,
        standardOutcomeIDs,
        text,
        orderBy,
        sortType,
        page,
        limit,
        status,
      } = this.formatSearchQuery(query);
      let response: { total: number; objects: LearningObject[] };

      if (userToken && requesterIsPrivileged(userToken)) {
        let conditions: QueryCondition[];
        if (!requesterIsAdminOrEditor(userToken)) {
          const privilegedCollections = getAccessGroupCollections(userToken);
          const collectionAccessMap = getCollectionAccessMap(
            collection,
            privilegedCollections,
            status,
          );
          const requestedCollections = collection && collection.length > 0;
          conditions = this.buildCollectionQueryConditions({
            requestedCollections,
            requestedStatuses: status,
            collectionAccessMap,
          });
          collection = null;
          status = null;
        } else {
          status = this.getAuthAdminEditorStatuses(status);
        }

        response = await dataStore.searchAllObjects({
          name,
          author,
          collection,
          length,
          level,
          guidelines,
          standardOutcomeIDs,
          text,
          status,
          conditions,
          orderBy,
          sortType,
          page,
          limit,
        });
      } else {
        response = await dataStore.searchReleasedObjects({
          name,
          author,
          collection,
          length,
          level,
          guidelines,
          standardOutcomeIDs,
          text,
          orderBy,
          sortType,
          page,
          limit,
        });
      }
      const objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            return object;
          }
        }),
      );
      return { total: response.total, objects };
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Builds QueryConditions based on requested collections and collectionAccessMap
   *
   * @private
   * @static
   * @param {boolean} requestedCollections [Represents whether or not specific collections were requested]
   * @param {string[]} requestedStatuses [Array of requested statuses]
   * @param {CollectionAccessMap} collectionAccessMap
   * @returns {QueryCondition[]}
   * @memberof LearningObjectInteractor
   */
  private static buildCollectionQueryConditions(params: {
    requestedCollections: boolean;
    requestedStatuses: string[];
    collectionAccessMap: CollectionAccessMap;
  }): QueryCondition[] {
    const {
      requestedCollections,
      requestedStatuses,
      collectionAccessMap,
    } = params;
    const conditions: QueryCondition[] = [];
    if (!requestedCollections) {
      if (
        !requestedStatuses ||
        (requestedStatuses &&
          requestedStatuses.length === 1 &&
          requestedStatuses[0] === LearningObject.Status.RELEASED)
      ) {
        conditions.push({
          status: LearningObject.Status.RELEASED,
        });
      }
    }

    const mapKeys = Object.keys(collectionAccessMap);
    for (const key of mapKeys) {
      const status = collectionAccessMap[key];
      conditions.push({ collection: key, status });
    }
    return conditions;
  }

  /**
   * Returns statuses admin and editors have access to. Throws an error if  unauthorized statuses are requested
   *
   * @private
   * @static
   * @param {string[]} status [Array of requested statuses]
   * @returns
   * @memberof LearningObjectInteractor
   */
  private static getAuthAdminEditorStatuses(status?: string[]): string[] {
    if (!status || (status && !status.length)) {
      return [
        ...LearningObjectState.IN_REVIEW,
        ...LearningObjectState.RELEASED,
      ];
    }

    if (
      status.includes(LearningObject.Status.REJECTED) ||
      status.includes(LearningObject.Status.UNRELEASED)
    ) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }

    return status;
  }

  /**
   * Formats search query to verify params are the appropriate types
   *
   * @private
   * @static
   * @param {LearningObjectQuery} query
   * @returns {LearningObjectQuery}
   * @memberof LearningObjectInteractor
   */
  private static formatSearchQuery(
    query: LearningObjectQuery,
  ): LearningObjectQuery {
    const formattedQuery = { ...query };
    formattedQuery.text = sanitizeText(formattedQuery.text) || null;
    formattedQuery.orderBy =
      sanitizeText(formattedQuery.orderBy, false) || null;
    formattedQuery.status = toArray(formattedQuery.status);
    formattedQuery.length = toArray(formattedQuery.length);
    formattedQuery.level = toArray(formattedQuery.level);
    formattedQuery.collection = toArray(formattedQuery.collection);
    formattedQuery.standardOutcomeIDs = toArray(
      formattedQuery.standardOutcomeIDs,
    );
    formattedQuery.guidelines = toArray(formattedQuery.guidelines);
    formattedQuery.page = toNumber(formattedQuery.page);
    formattedQuery.limit = toNumber(formattedQuery.limit);
    formattedQuery.sortType = <1 | -1>toNumber(formattedQuery.sortType);
    formattedQuery.sortType =
      formattedQuery.sortType === 1 || formattedQuery.sortType === -1
        ? formattedQuery.sortType
        : 1;

    if (formattedQuery.text) {
      const firstChar = formattedQuery.text.charAt(0);
      const lastChar = formattedQuery.text.charAt(
        formattedQuery.text.length - 1,
      );
      if (firstChar !== `"` && lastChar !== `"`) {
        formattedQuery.text = this.removeStopwords(formattedQuery.text);
      }
    }

    return sanitizeObject({ object: formattedQuery }, false);
  }

  public static async addToCollection(
    dataStore: DataStore,
    learningObjectId: string,
    collection: string,
  ): Promise<void> {
    try {
      await dataStore.addToCollection(learningObjectId, collection);
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Adds Children ids to Learning Object
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     children: string[];
   *     username: string;
   *     parentName: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async setChildren(params: {
    dataStore: DataStore;
    children: string[];
    parentName: string;
    username: string;
    userToken: UserToken;
  }): Promise<void> {
    const { dataStore, children, username, parentName, userToken } = params;

    try {
      const authorId = await dataStore.findUser(username);
      const parentID = await dataStore.findLearningObject({
        authorId,
        name: parentName,
      });
      const hasAccess = await hasLearningObjectWriteAccess(
        userToken,
        dataStore,
        parentID,
      );
      if (hasAccess) {
        await dataStore.setChildren(parentID, children);
        await updateObjectLastModifiedDate({
          dataStore,
          id: parentID,
          date: Date.now().toString(),
        });
      } else {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Removes child id from array of Learning Object children
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     childId: string;
   *     username: string;
   *     parentName: string;
   *   }} params
   * @returns
   * @memberof LearningObjectInteractor
   */
  public static async removeChild(params: {
    dataStore: DataStore;
    childId: string;
    parentName: string;
    username: string;
    userToken: UserToken;
  }) {
    const { dataStore, childId, username, parentName, userToken } = params;
    try {
      const authorId = await dataStore.findUser(username);
      const parentID = await dataStore.findLearningObject({
        authorId,
        name: parentName,
      });
      const hasAccess = await hasLearningObjectWriteAccess(
        userToken,
        dataStore,
        parentID,
      );
      if (hasAccess) {
        await dataStore.deleteChild(parentID, childId);
        await updateObjectLastModifiedDate({
          dataStore,
          id: parentID,
          date: Date.now().toString(),
        });
      } else {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }
    } catch (e) {
      handleError(e);
    }
  }

  /**
   * Uses passed authorization function to check if user has access to a resource
   *
   * @private
   * @static
   * @param {UserToken} params.userToken [Object containing information about the user requesting the resource]
   * @param {any} params.resourceVal [Resource value to run auth function against]
   * @param {Function} params.authFunction [Function used to check if user has ownership over resource]
   * @returns {boolean | Promise<boolean>}
   * @memberof LearningObjectInteractor
   */
  private static hasReadAccess(params: {
    userToken: UserToken;
    resourceVal: any;
    authFunction: (
      resourceVal: any,
      userToken: UserToken,
    ) => boolean | Promise<boolean>;
  }) {
    if (!params.userToken) {
      return false;
    }
    return params.authFunction(params.resourceVal, params.userToken);
  }
  /**
   * Fetches Metrics for Learning Object
   *
   * @private
   * @static
   * @param library the gateway to library data
   * @param {string} objectID
   * @returns {Promise<LearningObject.Metrics>}
   */
  private static loadMetrics(
    library: LibraryCommunicator,
    objectID: string,
  ): Promise<LearningObject.Metrics> {
    return library.getMetrics(objectID);
  }

  /**
   * Returns string without stopwords
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
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

/**
 * Replaces illegal file path characters with '_'.
 * Truncates string if longer than file path's legal max length of 250 (Windows constraint was said to be somewhere between 247-260);
 * .zip extension will make the max length go to 254 which is still within the legal range
 *
 * @export
 * @param {string} name
 * @returns {string}
 */
const MAX_CHAR = 250;
export function sanitizeFileName(name: string): string {
  let clean = name.replace(/[\\/:"*?<>|]/gi, '_');
  if (clean.length > MAX_CHAR) {
    clean = clean.slice(0, MAX_CHAR);
  }
  return clean;
}

/**
 * Returns new array with element(s) from value param or undefined if value was not defined
 *
 * @template T
 * @param {*} value
 * @returns {T[]}
 */
export function toArray<T>(value: any): T[] {
  if (value == null || value === '') {
    return null;
  }
  if (value && Array.isArray(value)) {
    return [...value].filter(v => !isEmptyValue(v));
  }
  return [value].filter(v => !isEmptyValue(v));
}

function isEmptyValue(value: any): boolean {
  if (value == null || value === '') {
    return true;
  }
  if (typeof value === 'string') {
    return sanitizeText(value) === '';
  }
  return false;
}

/**
 *
 * Converts non-number value to number if defined else returns null
 * @param {*} value
 * @returns {number}
 */
function toNumber(value: any): number {
  const num = parseInt(`${value}`, 10);
  if (!isNaN(num)) {
    return +value;
  }
  return null;
}

/**
 * Returns Map of collections to statuses representing read access privilege over associated collection
 *
 * @param {string[]} requestedCollections
 * @param {string[]} privilegedCollections
 * @returns CollectionAccessMap
 */
function getCollectionAccessMap(
  requestedCollections: string[],
  privilegedCollections: string[],
  requestedStatuses: string[],
): CollectionAccessMap {
  if (
    requestedStatuses &&
    (requestedStatuses.includes(LearningObject.Status.REJECTED) ||
      requestedStatuses.includes(LearningObject.Status.UNRELEASED))
  ) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  const accessMap = {};
  const authStatuses =
    requestedStatuses && requestedStatuses.length
      ? requestedStatuses
      : [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];

  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = authStatuses;
      } else {
        accessMap[filter] = LearningObjectState.RELEASED;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = authStatuses;
    }
  }

  return accessMap;
}

/**
 * Checks if requester is admin or username matches the username provided
 *
 * @param {string} username
 * @param {UserToken} userToken
 * @returns
 */
const checkAuthByUsername = (username: string, userToken: UserToken) =>
  requesterIsAdminOrEditor(userToken) ||
  requesterIsAuthor({ authorUsername: username, requester: userToken });

/**
 * Checks if requester is author byu the username provided
 *
 * @param {string} username
 * @param {UserToken} userToken
 * @returns
 */
const isAuthorByUsername = (
  username: string,
  userToken: UserToken,
): boolean => {
  return userToken.username === username;
};

/**
 * Checks if user has authorization based on collection
 *
 * @param {string} collectionName
 * @param {UserToken} userToken
 * @returns
 */
export const checkCollectionReadAccess = (
  collectionName: string,
  userToken: UserToken,
) =>
  hasReadAccessByCollection({
    requester: userToken,
    collection: collectionName,
  });

/**
 * This handler allows execution to proceed if a ResourceError occurs because of a resource not being found.
 * This allows authorized requesters to retry request on the working collection which requires explicit authorization
 *
 * @param {Error} error
 * @param {authorizationCases} boolean[] [Contains results from authorization checks that determines whether or not the requester is authorized to access resource]
 * @returns {null} [Returns null so that the value resolves to null indicating resource was not loaded]
 */
const bypassNotFoundResourceErrorIfAuthorized = ({
  error,
  authorizationCases,
}: {
  error: Error;
  authorizationCases: boolean[];
}): null | never => {
  if (!authorizationCases.includes(true)) {
    throw error;
  }
  return bypassNotFoundResourceError({ error });
};

/**
 * This handler allows execution to proceed if a ResourceError occurs because of a resource not being found.
 *
 * @param {Error} error
 * @returns {null} [Returns null so that the value resolves to null indicating resource was not loaded]
 */
const bypassNotFoundResourceError = ({
  error,
}: {
  error: Error;
}): null | never => {
  if (
    !(error instanceof ResourceError) ||
    (error instanceof ResourceError &&
      error.name !== ResourceErrorReason.NOT_FOUND)
  ) {
    throw error;
  }
  return null;
};

/**
 * Handles errors by throwing error if handled, otherwise the error is reported and a ServiceError is thrown
 *
 * @param {Error} error
 * @returns {never}
 */
export function handleError(error: Error): never {
  if (error instanceof ResourceError || error instanceof ServiceError) {
    throw error;
  }
  reportError(error);
  throw new ServiceError(ServiceErrorReason.INTERNAL);
}
