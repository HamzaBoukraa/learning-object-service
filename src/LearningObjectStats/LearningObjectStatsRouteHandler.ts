import * as LearningObjectStatsInteractor from './LearningObjectStatsInteractor';
import { Request, Response, Router } from 'express';
import { DataStore } from '../interfaces/DataStore';
import { LibraryCommunicator } from '../interfaces/interfaces';

/**
 * Initializes an express router with endpoints to get stats for Learning Objects
 */
export function initialize({
  router,
  dataStore,
  library,
}: {
  router: Router;
  dataStore: DataStore;
  library: LibraryCommunicator;
}) {
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

  router.route('/learning-objects/stats').get(getStats);
}
