import * as LearningObjectInteractor from './LearningObjectInteractor';
import { Request, Response, Router } from 'express';
import { LearningObject } from '@cyber4all/clark-entity';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { UserToken, LearningObjectUpdates } from '../types';

/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Object.
 */
export function initialize({
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
  router.delete('/learning-objects/:learningObjectName', deleteLearningObject);
  return router;
}
