import { Router, Request, Response, NextFunction } from 'express';
import * as Interactor from '../interactors/searchObjects/searchObjects';
import { Requester } from '../typings';
import { mapErrorToResponseData } from '../../shared/errors';
import { LearningObjectQuery } from '../../shared/interfaces/DataStore';
import { UserLearningObjectQuery } from '../../shared/types';
import { searchUsersObjects } from '../interactors/searchUsersObjects/searchUsersObjects';

/**
 * Builds the Express Router for this module
 *
 * @export
 * @returns
 */
export function buildRouter() {
  const router = Router();
  router.get('/learning-objects', searchObjects);
  router.get('/users/:username/learning-objects', searchUserLearningObjects);
  return router;
}

/**
 * Transforms request data and calls interactor to search objects
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function searchObjects(req: Request, res: Response, next: NextFunction) {
  try {
    const requester: Requester = req.user;
    const page =
      req.query.currPage != null ? req.query.currPage : req.query.page;
    const query: LearningObjectQuery = { ...req.query, page };
    const results = await Interactor.searchObjects({ requester, query });
    res.send(results);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

async function searchUserLearningObjects(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const authorUsername: string = req.params.username;
    const query: UserLearningObjectQuery = req.query;
    const learningObjects = await searchUsersObjects(
      {
        authorUsername,
        requester,
        query,
      },
    );
    res.status(200).send(learningObjects);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
};
