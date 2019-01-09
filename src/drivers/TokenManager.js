"use strict";
exports.__esModule = true;
var jwt = require("jsonwebtoken");
/**
 * Accepts a JWT and verifies that the token has been properly issued
 *
 * @param token the JWT as a string
 * @param callback the function to execute after verification
 */
function verifyJWT(token, res, callback) {
    try {
        var decoded = jwt.verify(token, process.env.KEY, {});
        if (typeof callback === 'function') {
            callback(status, decoded);
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.verifyJWT = verifyJWT;
function generateServiceToken() {
    var payload = {
        SERVICE_KEY: process.env.SERVICE_KEY
    };
    var options = {
        issuer: process.env.ISSUER,
        expiresIn: 86400,
        audience: 'https://clark.center'
    };
    return jwt.sign(payload, process.env.KEY, options);
}
exports.generateServiceToken = generateServiceToken;
function decode(token) {
    return new Promise(function (resolve, reject) {
        jwt.verify(token, process.env.KEY, {
            issuer: process.env.ISSUER
        }, function (err, decoded) {
            err ? reject(err) : resolve(decoded);
        });
    });
}
exports.decode = decode;
