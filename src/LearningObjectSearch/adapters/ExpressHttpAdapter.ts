import { Router, Request, Response } from 'express';
import * as Interactor from '../Interactor';
import { Requester } from '../typings';
import { mapErrorToResponseData } from '../../shared/errors';
import { LearningObjectQuery } from '../../shared/interfaces/DataStore';

/**
 * Builds the Express Router for this module
 *
 * @export
 * @returns
 */
export function buildRouter() {
  const router = Router();
  router.get('/learning-objects', searchObjects);
  return router;
}

/**
 * Transforms request data and calls interactor to search objects
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function searchObjects(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const query: LearningObjectQuery = req.query;
    const results = await Interactor.searchObjects({ requester, query });
    res.send(results);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}