import * as jwt from 'express-jwt';
import 'dotenv/config';
import { getBearerToken } from './functions';

/**
 * Validates and decodes token from cookie or authorization headers. Then sets request.user to decoded token.
 *
 * @param {Request} request
 * @param {Response} response
 * @param {NextFunction} next
 */
export const processToken = jwt({
  secret: process.env.KEY,
  issuer: process.env.ISSUER,
  credentialsRequired: false,
  getToken: req => {
    if (req.cookies && req.cookies.presence) {
      return req.cookies.presence;
    }
    return getBearerToken(req.headers.authorization);
  },
});
