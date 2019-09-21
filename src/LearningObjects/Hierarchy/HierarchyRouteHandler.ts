import { Router, Request, Response } from 'express';
import { DataStore } from '../../shared/interfaces/DataStore';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { fetchParents } from './interactors/HierarchyInteractor';
import { mapErrorToResponseData } from '../../shared/errors';
import { LearningObject } from '../../shared/entity';

export function initializePublic({
  router,
  dataStore,
}: {
  router: Router;
  dataStore: DataStore;
}) {
  const getParents = async (req: Request, res: Response) => {
    try {
      const userToken = req.user;

      // FIXME: this is returning LearningObjects even though it should return summaries
      const parents = (await fetchParents({
        learningObjectID: req.params.id,
        userToken,
        dataStore,
      })) as LearningObject[];
      res.status(200).send(parents);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  router.get('/learning-objects/:id/parents', getParents);
}
