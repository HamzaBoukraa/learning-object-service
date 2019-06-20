import { Router, Request, Response, NextFunction } from 'express';
import * as Interactor from '../Interactor';
import { Requester } from '../typings';
import { mapErrorToResponseData } from '../../shared/errors';
import { LearningObjectQuery } from '../../shared/interfaces/DataStore';
import { requesterIsAdmin } from '../../LearningObjects/AuthorizationManager';

const ALLOW_ELASTICSEARCH_TEST_TRAFFIC =
  process.env.ALLOW_ELASTICSEARCH_TEST_TRAFFIC;

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
async function searchObjects(req: Request, res: Response, next: NextFunction) {
  try {
    const requester: Requester = req.user;
    if (allowTraffic(requester)) {
      const query: LearningObjectQuery = req.query;
      const results = await Interactor.searchObjects({ requester, query });
      res.send(results);
    } else {
      next();
    }
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Determines whether or not traffic should be routed
 *
 * @param {Requester} requester [Information about the requester]
 * @returns {boolean}
 */
function allowTraffic(requester: Requester): boolean {
  return (
    JSON.parse(ALLOW_ELASTICSEARCH_TEST_TRAFFIC) || requesterIsAdmin(requester)
  );
}
