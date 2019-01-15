import { Router, Request, Response } from 'express';
import { submitForReview, cancelSubmission, createChangelog } from './SubmissionInteractor';
import { DataStore } from '../interfaces/DataStore';

/**
 * Initializes an express router with endpoints to publish and unpublish a learning object.
 *
 * A closure pattern is used here in order to create named functions for the route handlers.
 * This pattern allows easier code tracibility through the used of named fucntions. It
 * also eliminates the need to create an object that will stick around in memory when creating
 * a new router.
 * @param dataStore
 */
export function initialize(dataStore: DataStore) {
  async function submit(req: Request, res: Response) {

    try {
      const id = req.body.id;
      const username = req.user.username;

      await submitForReview(
        dataStore,
        username,
        id,
      );
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  }
  async function cancel(req: Request, res: Response) {
    try {
      const id = req.body.id;
      const username = req.user.username;

      await cancelSubmission(
        dataStore,
        username,
        id,
      );
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
    const learningObjectId = req.params.learningObjectId;
    const userId = req.body.userId;
    const changelogText = req.body.changelogText;
    try {
      await createChangelog(dataStore, learningObjectId, userId, changelogText);
      res.status(200).json({message: 'Changelog added'});
    } catch (e) {
      res.status(400).json({message: 'An error has occured'});
    }
   
  }

  const router: Router = Router();
  router.patch('/learning-objects/publish', submit);
  router.patch('/learning-objects/unpublish', cancel);
  router.post('/learning-objects/:learningObjectId/changelog', createLog);
  return router;
}
