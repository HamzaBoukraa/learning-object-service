import { Router, Request, Response } from 'express';
import { DataStore } from '../../shared/interfaces/DataStore';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { fetchParents } from './HierarchyInteractor';
import { mapErrorToResponseData } from '../../shared/errors';

export function initializePublic({ router, dataStore}: { router: Router, dataStore: DataStore }) {
  const getParents = async (req: Request, res: Response) => {
    try {
      const userToken = req.user;

      const parents = await fetchParents({
        learningObjectID: req.params.id,
        userToken,
        dataStore,
      });
      res.status(200).send(parents.map(obj => obj.toPlainObject()));
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };
  router.get('/learning-objects/:id/parents', getParents);
}
