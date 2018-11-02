import * as LearningObjectInteractor from './LearningObjectInteractor';
import { Request, Response, Router } from 'express';
import { LearningObject } from '@cyber4all/clark-entity';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { UserToken, LearningObjectUpdates } from '../types';

/**
 * Initializes an express router with endpoints for public Retrieving
 * a Learning Object.
 */
export function initializePublic({ dataStore }: { dataStore: DataStore }) {
  const router: Router = Router();

  /**
   * Retrieve a learning object by a specified ID
   * @param {Request} req
   * @param {Response} res
   */
  const getLearningObjectById = async (req: Request, res: Response) => {
    try {
      const id = req.params.learningObjectId;
      const learningObject = await LearningObjectInteractor.getLearningObjectById(
        dataStore,
        id,
      );
      res.status(200).send(learningObject);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  router.get('/learning-objects/:learningObjectId', getLearningObjectById);

  return router;
}

/**
 * Initializes an express router with endpoints for public Creating, Updating, and Deleting
 * a Learning Object.
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   library: LibraryCommunicator;
 * }} {
 *   dataStore,
 *   fileManager,
 *   library,
 * }
 * @returns
 */
export function initializePrivate({
  dataStore,
  fileManager,
  library,
}: {
  dataStore: DataStore;
  fileManager: FileManager;
  library: LibraryCommunicator;
}) {
  const router: Router = Router();
  const addLearningObject = async (req: Request, res: Response) => {
    try {
      const username = req.user.username;
      const object = LearningObject.instantiate(req.body.object);
      object.author.username = username;
      const learningObject = await LearningObjectInteractor.addLearningObject(
        dataStore,
        fileManager,
        object,
      );
      res.status(200).send(learningObject);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  const getMaterials = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const materials = await LearningObjectInteractor.getMaterials({
        dataStore,
        id,
      });
      res.status(200).send(materials);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  const updateLearningObject = async (req: Request, res: Response) => {
    try {
      const id: string = req.body.id;
      const updates = req.body.learningObject;
      const user: UserToken = req.user;
      await LearningObjectInteractor.updateLearningObject({
        user,
        dataStore,
        fileManager,
        id,
        updates,
      });
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  const deleteLearningObject = async (req: Request, res: Response) => {
    try {
      const learningObjectName = req.params.learningObjectName;
      await LearningObjectInteractor.deleteLearningObject(
        dataStore,
        fileManager,
        req.user.username,
        learningObjectName,
        library,
      );
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  router
    .route('/learning-objects')
    .post(addLearningObject)
    .patch(updateLearningObject);
  router.get('/learning-objects/:id/materials/all', getMaterials);
  router.delete('/learning-objects/:learningObjectName', deleteLearningObject);
  return router;
}
