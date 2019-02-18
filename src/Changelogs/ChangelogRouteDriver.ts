import { Request, Response, Router } from 'express';
import { mapErrorToStatusCode } from '../errors';
import { DataStore } from '../interfaces/DataStore';
import { UserToken } from '../types';
import * as ChangelogInteractor from './ChangelogInteractor';

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
}: {
  router: Router;
  dataStore: DataStore;
}) {
  async function createLog(req: Request, res: Response) {
    try {
      const learningObjectId = req.params.learningObjectId;
      const user: UserToken = req.user;
      const changelogText = req.body.changelogText;
      await ChangelogInteractor.createChangelog({dataStore, learningObjectId, user, changelogText});
      res.sendStatus(200);
    } catch (e) {
      const { code, message } = mapErrorToStatusCode(e);
      res.status(code).json({message});
    }
  }

  const getRecentChangelog = async (req: Request, res: Response) => {
    const learningObjectId = req.params.learningObjectId;
    try {
      const changelog = await ChangelogInteractor.getRecentChangelog(
        dataStore,
        learningObjectId,
      );
      res.status(200).send(changelog);
    } catch (e) {
      const { code, message } = mapErrorToStatusCode(e);
      res.status(code).json({message});
    }
  };

  router.post('/learning-objects/:learningObjectId/changelog', createLog);
  router.get('/learning-objects/:learningObjectId/changelog/:changelogId', getRecentChangelog);
}
