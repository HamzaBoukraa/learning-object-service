import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { getToken } from './functions';

/**
 * Checks if decoded token is set in request.
 * If user is not set, the token is verified from cookie presence or Bearer token
 * If no user and no valid token, responds with 401
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export function enforceAuthenticatedAccess(
  req: Request,
  res: Response,
  next: Function,
) {
  let user = req.user;
  const token = getToken(req);
  if (!user && token) {
    user = jwt.verify(token, process.env.KEY);
    req.user = user;
  }
  if (user) {
    next();
  } else {
    res.status(401).send('Invalid access!');
  }
}
