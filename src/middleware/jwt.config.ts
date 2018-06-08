import * as jwt from 'express-jwt';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Configuration for JWT middleware.
 *
 * @author Gustavus Shaw II
 */
export const enforceTokenAccess = jwt({
  secret: process.env.KEY,
  issuer: process.env.ISSUER,
  getToken: req => {
    if (req.cookies && req.cookies.presence)
      return req.cookies.presence;
    else if (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.split(' ')[0] === 'Bearer')
      return req.headers.authorization.split(' ')[1];

    return null;
  },
}).unless({
  // Routes that don't require authorization
  path: [
    '/',
    { url: '/learning-objects', methods: ['GET'] },
    {
      url: /\/learning-objects\/[0-z,.,-]+\/[0-z,.,-]+/i,
      methods: ['GET'],
    },
    '/learning-objects/multiple',
    /\/learning-objects\/[0-z,.,-]+\/summary/i,
    /\/learning-objects\/[0-z,.,-]+\/full/i,
    '/collections',
    '/collections/learning-objects',
    /\/collections\/.+\/learning-objects/i,
    /\/users\/[0-z,.,-]+\/learning-objects/i,
  ],
});
