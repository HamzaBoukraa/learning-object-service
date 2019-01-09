"use strict";
exports.__esModule = true;
var jwt = require("jsonwebtoken");
function enforceAdminAccess(req, res, next) {
    var user = req.user;
    var cookie = req.cookies.presence;
    if (!user && cookie) {
        user = jwt.decode(cookie);
    }
    if (user && user.accessGroups && user.accessGroups.includes('admin')) {
        next();
    }
    else {
        res.status(401).send('Invalid access!');
    }
}
exports.enforceAdminAccess = enforceAdminAccess;
