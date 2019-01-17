import * as LearningObjectInteractor from './LearningObjectInteractor';
import { Request, Response, Router } from 'express';
import { LearningObject } from '@cyber4all/clark-entity';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';

/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Object.
 */
export function initialize({ dataStore, fileManager, library}: { dataStore: DataStore, fileManager: FileManager, library: LibraryCommunicator}) {
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
        res.sendStatus(200);
      } else {
        res.status(403).send('Invalid access. Could not update Learning Object');
      }
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

  const getRecentChangelog = async (req: Request, res: Response) => {
    const learningObjectId = req.params.learningObjectId;
    try {
      const changelog = await LearningObjectInteractor.getRecentChangelog(
        dataStore,
        learningObjectId
      );
      res.status(200).send(changelog);
    } catch (e) {
      console.error(e);
      res.status(417).json({message: 'Could not find recent changelog for learning object: ' + learningObjectId});
    }
  }

  router
      .route('/learning-objects')
      .post(addLearningObject)
      .patch(updateLearningObject);
  router.delete('/learning-objects/:learningObjectName', deleteLearningObject);
  router.get('/learning-objects/:learningObjectId/changelog/:changelogId', getRecentChangelog);
  return router;
}
