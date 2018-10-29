import { Router, Request, Response } from 'express';
import { togglePublished } from './SubmissionInteractor';
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
  async function publish(req: Request, res: Response) {

    try {
      const id = req.body.id;
      const published = req.body.published;
      const username = req.user.username;

      await togglePublished(
        dataStore,
        username,
        id,
        published,
      );
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  }
  async function unpublish(req: Request, res: Response) {
    try {
      const id = req.body.id;
      const published = req.body.published;
      const username = req.user.username;

      await togglePublished(
        dataStore,
        username,
        id,
        published,
      );
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  }
  const router: Router = Router();
  router.patch('/learning-objects/publish', publish);
  router.patch('/learning-objects/unpublish', unpublish);
  return router;
}
