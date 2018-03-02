import * as jwt from 'express-jwt';

/**
 * Configuration for JWT middleware.
 *
 * @author Gustavus Shaw II
 */
export const enforceTokenAccess = jwt({
    secret: process.env.KEY,
    issuer: process.env.ISSUER,
    getToken: (req) => {
        return req.cookies.presence;
    },
}).unless({
    // Routes that don't require authorization
    path: ['/', '/api', '/api/authenticate', '/api/register'],
});
