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
    return req.cookies.presence;
  }
}).unless({
  // Routes that don't require authorization
  path: [
    '/',
    { url: '/learning-objects', methods: ['GET'] },
    {
      url: /\/learning-objects\/[A-Z,a-z,0-9,_]+\/[A-Z,a-z,0-9,_]+/i,
      methods: ['GET']
    },
    '/learning-objects/multiple',
    /\/learning-objects\/[(A-Z,a-z,0-9,_)]+\/summary/i,
    /\/learning-objects\/[(A-Z,a-z,0-9,_)]+\/full/i,
    '/collections',
    '/collections/learning-objects',
    /\/collections\/[(A-Z,a-z,0-9,_)]+\/learning-objects/i
  ]
});
