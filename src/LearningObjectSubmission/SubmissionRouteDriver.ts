import { Request, Response, Router } from 'express';
import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { cancelSubmission, submitForReview, checkFirstSubmission } from './SubmissionInteractor';
import { mapErrorToResponseData } from '../errors';

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
      const learningObjectId = req.params.learningObjectId;
      const userId = req.params.userId;
      const username = req.user.username;
      const collection = req.body.collection;

      await submitForReview({
        dataStore,
        fileManager,
        username,
        learningObjectId,
        userId,
        collection,
      });

      res.sendStatus(200);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  }

  async function fetchSubmission(req: Request, res: Response) {
    try {
      const learningObjectId = req.params.learningObjectId;
      const userId = req.params.userId;
      const collection = req.params.collectionName;
      const username = req.user.username;

      const isFirstSubmission = await checkFirstSubmission({
        dataStore,
        learningObjectId,
        collection,
        username,
        userId,
      });

      res.send(200).json(isFirstSubmission);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  }

  async function cancel(req: Request, res: Response) {
    try {
      const learningObjectId = req.params.learningObjectId;
      const userId = req.params.userId;
      const username = req.user.username;

      await cancelSubmission({
        dataStore,
        learningObjectId,
        userId,
        username,
      });
      res.sendStatus(200);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  }

  router.get('users/:userId/learning-objects/:learningObjectId/submission/collections/:collectionName', fetchSubmission);
  router.post('users/:userId/learning-objects/:learningObjectId/submission', submit);
  router.delete('users/:userId/learning-objects/:learningObjectId/submission', cancel);
}
