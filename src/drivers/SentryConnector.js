"use strict";
exports.__esModule = true;
var raven = require("raven");
exports.reportError = function (error) {
    raven.captureException(error);
};
