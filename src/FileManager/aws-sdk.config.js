"use strict";
exports.__esModule = true;
var env = require("dotenv");
env.config();
exports.AWS_SDK_CONFIG = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION
};
