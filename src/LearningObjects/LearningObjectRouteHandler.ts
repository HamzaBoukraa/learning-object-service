import { ExpressResponder } from '../drivers/drivers';
import * as LearningObjectInteractor from './LearningObjectInteractor';
import { Request, Response, Router } from 'express';
import { LearningObject } from '@cyber4all/clark-entity';
import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';

/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Object.
 */
export function initialize({ dataStore, fileManager}: { dataStore: DataStore, fileManager: FileManager}) {
  const router: Router = Router();
  const addLearningObject = async (req: Request, res: Response) => {
    const responder = new ExpressResponder(res);
    try {
      const username = req.user.username;
      const object = LearningObject.instantiate(req.body.object);
      object.author.username = username;
      const learningObject = await LearningObjectInteractor.addLearningObject(
        dataStore,
        fileManager,
        object,
      );
      responder.sendObject(learningObject);
    } catch (e) {
      responder.sendOperationError(e);
    }
  };
  const updateLearningObject = async (req: Request, res: Response) => {
    const responder = new ExpressResponder(res);
    try {
      // FIXME: Instantiate should possibly be done in the interactor
      const object = LearningObject.instantiate(req.body.learningObject);
      const user = req.user;
      // FIXME: Authorization should be done in the interactor
      if (user.username === object.author.username) {
        await LearningObjectInteractor.updateLearningObject(
          dataStore,
          fileManager,
          object.id,
          object,
        );
        responder.sendOperationSuccess();
      } else {
        responder.unauthorized('Could not update Learning Object');
      }
    } catch (e) {
      responder.sendOperationError(e);
    }
  };
  const deleteLearningObject = async (req: Request, res: Response) => {
    const responder = new ExpressResponder(res);
    try {
      const learningObjectName = req.params.learningObjectName;
      await LearningObjectInteractor.deleteLearningObject(
        dataStore,
        fileManager,
        req.user.username,
        learningObjectName,
      );
      responder.sendOperationSuccess();
    } catch (e) {
      responder.sendOperationError(e);
    }
  };
  router
      .route('/learning-objects')
      .post(addLearningObject)
      .patch(updateLearningObject);
  router.delete('/learning-objects/:learningObjectName', deleteLearningObject);
  return router;
}
