import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
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
