import * as jwt from 'express-jwt';
import { key, issuer } from '../config/config';

/**
 * Configuration for JWT middleware.
 *
 * @author Gustavus Shaw II
 */
export const enforceTokenAccess = jwt({
    secret: key,
    issuer: issuer,
}).unless({
    // Routes that don't require authorization
    path: ['/', '/api', '/api/authenticate', '/api/register'],
});
