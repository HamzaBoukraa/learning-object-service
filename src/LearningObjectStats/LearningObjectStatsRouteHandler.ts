import * as LearningObjectStatsInteractor from './LearningObjectStatsInteractor';
import { Request, Response, Router } from 'express';
import { DataStore } from '../interfaces/DataStore';
import { LibraryCommunicator } from '../interfaces/interfaces';

/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Object.
 */
export function initialize({
  dataStore,
  library,
}: {
  dataStore: DataStore;
  library: LibraryCommunicator;
}) {
  const router: Router = Router();
  const getStats = async (req: Request, res: Response) => {
    try {
      const query = req.query;

      const stats = await LearningObjectStatsInteractor.getStats({
        dataStore,
        library,
        query,
      });

      res.status(200).send(stats);
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };

  router.route('').get(getStats);
  return router;
}
