import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../../shared/errors';
import { DataStore } from '../../shared/interfaces/DataStore';
import {
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import { UserToken } from '../../shared/types';
import * as LearningObjectInteractor from '../LearningObjectInteractor';
import { LearningObject } from '../../shared/entity';
import {  MaterialsFilter, LearningObjectFilter } from '../typings';

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
   * Retrieve a learning object by a specified ID
   * @param {Request} req
   * @param {Response} res
   */
  const getLearningObjectById = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const filter: LearningObjectFilter = req.query.status;
      const id = req.params.learningObjectId;
      const learningObject = await LearningObjectInteractor.getLearningObjectById(
        { dataStore, library, id, requester, filter },
      );
      res.status(200).send(learningObject.toPlainObject());
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

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
}