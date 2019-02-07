import { Request, Response, Router } from 'express';
import { LearningObjectError } from '../errors';
import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { UserToken } from '../types';
import { cancelSubmission, createChangelog, submitForReview } from './SubmissionInteractor';

/**
 * Initializes an express router with endpoints to publish and unpublish a learning object.
 *
 * A closure pattern is used here in order to create named functions for the route handlers.
 * This pattern allows easier code tracibility through the use of named fucntions. It
 * also eliminates the need to create an object that will stick around in memory when creating
 * a new router.
 *
 * @param dataStore
 */
export function initialize({
  router,
  dataStore,
  fileManager,
}: {
  router: Router;
  dataStore: DataStore;
  fileManager: FileManager;
}) {
  async function submit(req: Request, res: Response) {
    try {
      const id = req.params.learningObjectId;
      const username = req.user.username;
      const collection = req.body.collection;

      await submitForReview({
        dataStore,
        fileManager,
        username,
        id,
        collection,
      });

      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  }

  async function cancel(req: Request, res: Response) {
    try {
      const id = req.params.learningObjectId;

      await cancelSubmission(dataStore, id);
      res.sendStatus(200);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        res.status(500).send(e.message);
      } else {
        res.status(400).send(e);
      }
    }
  }

  async function createLog(req: Request, res: Response) {
    try {
      const learningObjectId = req.params.learningObjectId;
      const user: UserToken = req.user;
      const changelogText = req.body.changelogText;
      await createChangelog({dataStore, learningObjectId, user, changelogText});
      res.status(200);
    } catch (e) {
      if (e instanceof Error) {
        switch (e.message) {
          case LearningObjectError.INVALID_ACCESS():
            res.status(401).json({message: `${e.message}`});
            break;
          case LearningObjectError.LEARNING_OBJECT_NOT_FOUND():
            res.status(404).json({message: `${e.message}`});
            break;
          default:
            res.status(500).json({message: `${e.message}`});
            break;
        }
      }
      res.status(500).json({message: `Could not create changelog for specified learning object. ${e}`});
    }
  }

  router.post('/learning-objects/:learningObjectId/submission', submit);
  router.delete('/learning-objects/:learningObjectId/submission', cancel);
  router.post('/learning-objects/:learningObjectId/changelog', createLog);
}
