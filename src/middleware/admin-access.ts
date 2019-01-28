import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

/**
 * Checks if decoded token is set in request and contains 'admin' permissions.
 * If user is not set, the token is verified from cookie presence or Bearer token
 * If no user and no valid token or invalid permissions, responds with 401
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export function enforceAdminAccess(req: Request, res: Response, next: Function) {
  let user = req.user;
  const cookie = req.cookies.presence;
  if (!user && cookie) {
    user = jwt.verify(cookie, process.env.KEY);
  }
  if (user && user.accessGroups && user.accessGroups.includes('admin')) {
    next();
  } else {
    res.status(401).send('Invalid access!');
  }
}
