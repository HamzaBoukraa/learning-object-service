import { Request, Response, Router } from 'express';
import { mapErrorToResponseData } from '../shared/errors';
import { UserToken } from '../shared/types';
import * as RevisionInteractor from './interactors';
import { RevisionsMongoDriver } from './RevisionsMongoDriver';
import { RevisionsDataStore } from './RevisionsDataStore';
import { ElasticsearchDriver } from './ElasticsearchDriver';
import { RevisionsSearchIndex } from './RevisionsSearchIndex';

/**
 * Initializes an Express router for the Revision resource.
 * @param router the Express router to inject Revision routes into
 * @param dataStore the stupid big data store
 * @param library the Gateway to the Library Service
 * @returns
 */
export function initializePrivate({ router }: { router: Router }) {
  const revisionsDataStore = new RevisionsMongoDriver();
  const revisionsSearchIndex = new ElasticsearchDriver();

  const createRevision = async (req: Request, res: Response) => {
    try {
      const params: {
        username: string,
        cuid: string, dataStore: RevisionsDataStore, searchIndex: RevisionsSearchIndex, requester: UserToken } = {
          ...req.params,
          dataStore: revisionsDataStore,
          searchIndex: revisionsSearchIndex,
          requester: req.user,
        };

      const revisionUri = await RevisionInteractor.createLearningObjectRevision(params);
      res.status(200).json({ revisionUri });
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.post('/users/:username/learning-objects/:cuid/versions', createRevision);
}
