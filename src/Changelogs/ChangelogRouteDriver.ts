import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../shared/errors';
import { DataStore } from '../shared/interfaces/DataStore';
import { UserToken } from '../shared/types';
import * as ChangelogInteractor from './ChangelogInteractor';
import { ModuleLearningObjectGateway } from './ModuleLearningObjectGateway';

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
      const userId = req.params.userId;
      const cuid = req.params.cuid;
      const user: UserToken = req.user;
      const changelogText = req.body.changelogText;
      await ChangelogInteractor.createChangelog({
        dataStore,
        cuid,
        user,
        userId,
        changelogText,
      });
      res.sendStatus(200);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  }

  /**
   * @deprecated remove when client routes are updated to use the
   * recent query parameter for getAllChangelogs
   */
  const getRecentChangelog = async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const userId = req.params.userId;
      const cuid = req.params.cuid;
      const changelog = await ChangelogInteractor.getRecentChangelog({
        dataStore,
        cuid,
        userId,
        user,
      });
      res.status(200).send(changelog);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  const getAllChangelogs = async (req: Request, res: Response) => {
    try {
      const learningObjectGateway = new ModuleLearningObjectGateway();
      const user = req.user;
      const userId = req.params.userId;
      const cuid = req.params.cuid;
      const recent = req.query.recent;
      const minusRevision = req.query.minusRevision;
      const changelogs = await ChangelogInteractor.getChangelogs({
        learningObjectGateway,
        dataStore,
        cuid,
        userId,
        user,
        recent,
        minusRevision,
      });
      res.status(200).json(changelogs);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  router.post('/users/:userId/learning-objects/:cuid/changelog', createLog);
  router.get('/users/:userId/learning-objects/:cuid/changelogs', getAllChangelogs);
  router.get('/users/:userId/learning-objects/:cuid/changelog', getRecentChangelog);
}
