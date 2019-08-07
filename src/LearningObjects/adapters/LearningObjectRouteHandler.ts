import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../../shared/errors';
import { DataStore } from '../../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import {
  UserLearningObjectQuery,
  UserToken,
  LearningObjectSummary,
} from '../../shared/types';
import * as LearningObjectInteractor from '../LearningObjectInteractor';
import { LearningObject } from '../../shared/entity';
import { LearningObjectFilter, MaterialsFilter } from '../typings';
import { initializePrivate as initializeRevisionRoutes } from '../Revisions/RevisionRouteHandler';
import { toBoolean } from '../../shared/functions';

/**
 * Initializes an express router with endpoints for public Retrieving
 * a Learning Object.
 */
export function initializePublic({
  router,
  dataStore,
  library,
}: {
  router: Router;
  dataStore: DataStore;
  library: LibraryCommunicator;
}) {
  const searchUserLearningObjects = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username;
      const query: UserLearningObjectQuery = req.query;
      const learningObjects = await LearningObjectInteractor.searchUsersObjects(
        {
          dataStore,
          authorUsername,
          requester,
          query,
        },
      );
      res.status(200).send(learningObjects);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const getLearningObjectByName = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username;
      const learningObjectName: string = req.params.learningObjectName;
      const version: boolean = req.query.version;
      const object = await LearningObjectInteractor.getLearningObjectByName({
        dataStore,
        library,
        userToken: requester,
        username: authorUsername,
        learningObjectName,
        version,
      });
      res.status(200).send(object.toPlainObject());
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  /**
   * Retrieve a learning object by a specified ID
   * @param {Request} req
   * @param {Response} res
   */
  const getLearningObjectById = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const filter: LearningObjectFilter = req.query.status;
      const summary: boolean = toBoolean(req.query.summary);
      const id: string = req.params.learningObjectId;
      let learningObject: Partial<LearningObject> | LearningObjectSummary;
      if (summary) {
        learningObject = await LearningObjectInteractor.getLearningObjectSummaryById(
          { dataStore, id, requester, filter },
        );
      } else {
        learningObject = (await LearningObjectInteractor.getLearningObjectById({
          dataStore,
          library,
          id,
          requester,
          filter,
        })).toPlainObject();
      }
      res.status(200).send(learningObject);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  /**
   * @deprecated This route will be deprecated because of its non-RESTFul route structure
   * Please update to using `/users/:username/learning-objects` route.
   */
  router.get(
    '/learning-objects/:username/learning-objects',
    searchUserLearningObjects,
  );
  router.get('/users/:username/learning-objects', searchUserLearningObjects);
  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId` route.
   * if requesting a Learning Object by name
   */
  router.get(
    '/learning-objects/:username/:learningObjectName',
    getLearningObjectByName,
  );
  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId`
   * if requesting a Learning Object by id
   */
  router.get('/learning-objects/:learningObjectId', getLearningObjectById);
  router.get(
    '/users/:username/learning-objects/:learningObjectId',
    getLearningObjectById,
  );

  return router;
}

/**
 * Initializes an express router with endpoints for public Creating, Updating, and Deleting
 * a Learning Object.
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   library: LibraryCommunicator;
 * }} {
 *   dataStore,
 *   fileManager,
 *   library,
 * }
 * @returns
 */
export function initializePrivate({
  router,
  dataStore,
  library,
}: {
  router: Router;
  dataStore: DataStore;
  library: LibraryCommunicator;
}) {
  const addLearningObject = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username || req.user.username;
      const object: Partial<LearningObject> = req.body.object;
      const learningObject = await LearningObjectInteractor.addLearningObject({
        dataStore,
        object,
        authorUsername,
        requester,
      });
      res.status(200).send(learningObject.toPlainObject());
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const getMaterials = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const id: string = req.params.id;
      const filter: MaterialsFilter = req.query.status;
      const materials = await LearningObjectInteractor.getMaterials({
        dataStore,
        id,
        requester,
        filter,
      });
      res.status(200).send(materials);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const updateLearningObject = async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      const updates: Partial<LearningObject> =
        req.body.updates || req.body.learningObject;
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username || req.user.username;
      await LearningObjectInteractor.updateLearningObject({
        dataStore,
        requester,
        id,
        authorUsername,
        updates,
      });
      res.sendStatus(204);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const deleteLearningObjectByName = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const learningObjectName = req.params.learningObjectName;
      await LearningObjectInteractor.deleteLearningObjectByName({
        dataStore,
        learningObjectName,
        library,
        user,
      });
      res.sendStatus(204);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  const deleteLearningObject = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const id: string = req.params.id;
      await LearningObjectInteractor.deleteLearningObject({
        dataStore,
        library,
        id,
        requester,
      });
      res.sendStatus(204);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  const getLearningObjectChildren = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const children = await LearningObjectInteractor.getLearningObjectChildrenById(
        dataStore,
        id,
      );
      res.status(200).json(children.map(c => c.toPlainObject()));
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.route('/learning-objects').post(addLearningObject);
  router.post('/users/:username/learning-objects', addLearningObject);
  router.patch('/learning-objects/:id', updateLearningObject);
  router
    .route('/users/:username/learning-objects/:id')
    .patch(updateLearningObject)
    .delete(deleteLearningObject);
  router.delete(
    '/learning-objects/:learningObjectName',
    deleteLearningObjectByName,
  );
  router.get('/users/:username/learning-objects/:id/materials', getMaterials);
  router.get('/learning-objects/:id/materials/all', getMaterials);
  router.get(
    '/learning-objects/:id/children/summary',
    getLearningObjectChildren,
  );
  initializeRevisionRoutes({ router, dataStore, library });
}
