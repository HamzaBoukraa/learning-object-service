import { Router, Request, Response } from 'express';
import { DataStore } from '../../interfaces/DataStore';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { fetchParents } from './HierarchyInteractor';

export function initializePublic({ router, dataStore}: { router: Router, dataStore: DataStore }) {
  const getParents = async (req: Request, res: Response) => {
    try {
      const userToken = req.user;
      const query = req.query;
      query.id = req.params.id;
      const isRequestingRevision = query.revision !== undefined;

      const parents = await fetchParents({
        query,
        userToken,
        dataStore,
        isRequestingRevision,
      });
      res.status(200).send(parents.map(obj => obj.toPlainObject()));
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  };
  router.get('/learning-objects/:id/parents', getParents);
}
