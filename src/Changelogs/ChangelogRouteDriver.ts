import { Request, Response, Router } from 'express';
import { LearningObjectError } from '../errors';
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

  const getRecentChangelog = async (req: Request, res: Response) => {
    const learningObjectId = req.params.learningObjectId;
    try {
      const changelog = await ChangelogInteractor.getRecentChangelog(
        dataStore,
        learningObjectId,
      );
      res.status(200).send(changelog);
    } catch (e) {
      console.error(e);
      res.status(404).json({message: 'Could not find recent changelog for learning object: ' + learningObjectId});
    }
  };

  router.post('/learning-objects/:learningObjectId/changelog', createLog);
  router.get('/learning-objects/:learningObjectId/changelog/:changelogId', getRecentChangelog);
}
