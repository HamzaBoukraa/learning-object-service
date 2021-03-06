import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../../shared/errors';
import { DataStore } from '../../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import { UserToken } from '../../shared/types';
import * as LearningObjectInteractor from '../LearningObjectInteractor';
import { LearningObject } from '../../shared/entity';
import { LearningObjectFilter, MaterialsFilter } from '../typings';
import { toBoolean, mapLearningObjectToSummary } from '../../shared/functions';
import { LibraryDriver } from '../../drivers/LibraryDriver';

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
  /**
   * Retrieve a learning object summary by a specified ID
   * @param {Request} req
   * @param {Response} res
   */
  const getLearningObjectById = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const filter: LearningObjectFilter = req.query.status;
      const summary: boolean = toBoolean(req.query.summary);
      const id: string = req.params.learningObjectId;
      const learningObject = await LearningObjectInteractor.getLearningObjectSummaryById(
        { dataStore, id, requester, filter },
      );

      res.status(200).send(learningObject);
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
      });
      res.status(200).send(materials);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const getLearningObjectChildrenSummaries = async (
    req: Request,
    res: Response,
  ) => {
    try {
      const learningObjectId = req.params.id;
      const children = await LearningObjectInteractor.getLearningObjectChildrenSummariesById(
        dataStore,
        req.user,
        new LibraryDriver(),
        learningObjectId,
      );
      res.status(200).json(children);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  const getLearningObjectByCuid = async (req: Request, res: Response, next: any) => {
    try {
      const cuid = req.params.cuid;
      const requester = req.user;
      const authorUsername = req.params.username;
      const version = parseInt(req.query.version, 10);

      if (cuid.indexOf('-') === -1) {
        // this isn't a CUID, fall through to learning object :id
        next();
        return;
      }

      const results = await LearningObjectInteractor.getInternalLearningObjectByCuid({ dataStore, requester, authorUsername, cuid, version: version >= 0 ? version : undefined });
      if (results.length > 1) {
        if (results[0].version < results[1].version) {
          results[0].attachRevisionUri();
        } else if (results[1].version < results[0].version) {
          results[1].attachRevisionUri();
        }
      }
      res.json(results.map(r => mapLearningObjectToSummary(r)));
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.get('/users/:username/learning-objects/:cuid', getLearningObjectByCuid);

  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId`
   * if requesting a Learning Object by id
   */
  router.get('/learning-objects/:learningObjectId', getLearningObjectById);
  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId` route.
   * if requesting a Learning Object by name.
   */
  router.get(
    '/users/:username/learning-objects/:learningObjectId',
    getLearningObjectById,
  );
  router.get('/users/:username/learning-objects/:id/materials', getMaterials);

  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId/materials`
   */
  router.get('/learning-objects/:id/materials/all', getMaterials);

  /**
   * @deprecated This route will be deprecated because of its non RESTful route structure
   * Please update to using `/users/:username/learning-objects/:learningObjectId/children` route.
   *
   */
  router.get(
    '/learning-objects/:id/children/summary',
    getLearningObjectChildrenSummaries,
  );

  router.get(
    '/users/:username/learning-objects/:id/children',
    getLearningObjectChildrenSummaries,
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
  const updateLearningObject = async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      const updates: Partial<LearningObject> =
        req.body.updates || req.body.learningObject;
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username || req.user.username;
      await LearningObjectInteractor.updateLearningObject({
        dataStore,
        library,
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
      const cuid = req.params.cuid;
      const version = parseInt(req.params.version, 10);
      await LearningObjectInteractor.deleteLearningObjectByCuidVersion({
        dataStore,
        cuid,
        version,
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
        isReleased: false,
      });
      res.sendStatus(204);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.route('/learning-objects').post(addLearningObject);
  router.post('/users/:username/learning-objects', addLearningObject);
  /**
   * @deprecated please use /users/:username/learning-objects/:id below
   */
  router.patch('/learning-objects/:id', updateLearningObject);
  router
    .route('/users/:username/learning-objects/:id')
    .patch(updateLearningObject)
    .delete(deleteLearningObject);
  router.delete(
    '/learning-objects/:learningObjectName',
    deleteLearningObjectByName,
  );
}
