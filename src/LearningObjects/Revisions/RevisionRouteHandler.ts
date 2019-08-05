import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../../shared/errors';
import { DataStore } from '../../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import { LearningObjectSummary } from '../../shared/types';
import { LearningObject } from '../../shared/entity';
import { toBoolean } from '../../shared/functions';
import * as RevisionInteractor from './interactors';

/**
 * Initializes an Express router for the Revision resource.
 * @param router the Express router to inject Revision routes into
 * @param dataStore the stupid big data store
 * @param library the Gateway to the Library Service
 * @returns
 */
export function initializePrivate({
  router,
  dataStore,
  library,
}: {
  router: Router;
  dataStore: DataStore;
  library: LibraryCommunicator;
}) {
  const createRevision = async (req: Request, res: Response) => {
    try {
      const params = { ...req.params, dataStore, requester: req.user };
      const newRevisionId = await RevisionInteractor.createLearningObjectRevision(params);
      res.status(200).json({revision: newRevisionId});
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  const getRevision = async (req: Request, res: Response) => {
    try {
      const params = {
        ...req.params,
        revisionId: parseInt(req.params.revisionId, 10),
        dataStore,
        library,
        requester: req.user,
        summary: toBoolean(req.query.summary),
      };
      let learningObjectRevision: LearningObject | LearningObjectSummary | Partial<LearningObject>;
      learningObjectRevision = await RevisionInteractor.getLearningObjectRevision(params);
      if (learningObjectRevision instanceof LearningObject) {
        learningObjectRevision = learningObjectRevision.toPlainObject();
      }
      res.status(200).json(learningObjectRevision);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  router.post('/users/:username/learning-objects/:learningObjectId/revisions', createRevision);
  router.get('/users/:username/learning-objects/:learningObjectId/revisions/:revisionId', getRevision);
}
