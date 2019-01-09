"use strict";
exports.__esModule = true;
var jwt = require("express-jwt");
/**
 * Configuration for JWT middleware.
 *
 * @author Gustavus Shaw II
 */
exports.enforceTokenAccess = jwt({
    secret: process.env.KEY,
    issuer: process.env.ISSUER,
    getToken: function (req) {
        if (req.cookies && req.cookies.presence) {
            return req.cookies.presence;
        }
        if (req.headers.authorization &&
            typeof req.headers.authorization === 'string' &&
            req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        }
        return null;
    }
});
