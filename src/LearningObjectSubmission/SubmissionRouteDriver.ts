import { Router, Request, Response } from 'express';
import { togglePublished } from './SubmissionInteractor';
import { DataStore } from '../interfaces/DataStore';
import { ExpressResponder } from '../drivers/express/ExpressResponder';

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
    const responder = new ExpressResponder(res);
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
      responder.sendOperationSuccess();
    } catch (e) {
      console.error(e);
      responder.sendOperationError(e);
    }
  }
  async function unpublish(req: Request, res: Response) {
    const responder = new ExpressResponder(res);
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
      responder.sendOperationSuccess();
    } catch (e) {
      responder.sendOperationError(e);
    }
  }
  const router: Router = Router();
  router.patch('/learning-objects/publish', publish);
  router.patch('/learning-objects/unpublish', unpublish);
  return router;
}
