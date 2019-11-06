import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../shared/errors';
import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { LearningObjectSummary, UserToken } from '../shared/types';
import { LearningObject } from '../shared/entity';
import { toBoolean } from '../shared/functions';
import * as RevisionInteractor from './interactors';
import { RevisionsMongoDriver } from './RevisionsMongoDriver';
import { RevisionsDataStore } from './RevisionsDataStore';

/**
 * Initializes an Express router for the Revision resource.
 * @param router the Express router to inject Revision routes into
 * @param dataStore the stupid big data store
 * @param library the Gateway to the Library Service
 * @returns
 */
export function initializePrivate({ router }: { router: Router }) {
  const revisionsDataStore = new RevisionsMongoDriver();

  const createRevision = async (req: Request, res: Response) => {
    try {
      const params: { username: string, cuid: string, dataStore: RevisionsDataStore, requester: UserToken } = { ...req.params, dataStore: revisionsDataStore, requester: req.user };

      const revisionUri = await RevisionInteractor.createLearningObjectRevision(params);
      res.status(200).json({ revisionUri });
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.post('/users/:username/learning-objects/:cuid/versions', createRevision);
}
