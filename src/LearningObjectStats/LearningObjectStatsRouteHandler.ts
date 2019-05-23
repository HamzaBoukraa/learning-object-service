import * as LearningObjectStatsInteractor from './LearningObjectStatsInteractor';
import { Request, Response, Router } from 'express';
import { DataStore } from '../shared/interfaces/DataStore';

/**
 * Initializes an express router with endpoints to get stats for Learning Objects
 */
export function initialize({
  router,
  dataStore,
}: {
  router: Router;
  dataStore: DataStore;
}) {
  const getStats = async (req: Request, res: Response) => {
    try {
      const query = req.query;

      const stats = await LearningObjectStatsInteractor.getStats({
        dataStore,
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
