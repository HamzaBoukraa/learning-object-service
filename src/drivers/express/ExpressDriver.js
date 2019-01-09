"use strict";
exports.__esModule = true;
var express = require("express");
var bodyParser = require("body-parser");
var drivers_1 = require("../drivers");
var http = require("http");
var logger = require("morgan");
var jwt_config_1 = require("../../middleware/jwt.config");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var admin_access_1 = require("../../middleware/admin-access");
var raven = require("raven");
var ExpressDriver = /** @class */ (function () {
    function ExpressDriver() {
    }
    ExpressDriver.start = function (dataStore, fileManager, library) {
        raven
            .config(process.env.SENTRY_DSN)
            .install();
        this.app.use(raven.requestHandler());
        this.app.use(raven.errorHandler());
        // configure app to use bodyParser()
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(bodyParser.json());
        // Setup route logger
        this.app.use(logger('dev'));
        this.app.use(cors({
            origin: true,
            credentials: true
        }));
        // Set up cookie parser
        this.app.use(cookieParser());
        // Set our public api routes
        this.app.use('/', drivers_1.ExpressRouteDriver.buildRouter(dataStore, library, fileManager));
        // Set Validation Middleware
        this.app.use(jwt_config_1.enforceTokenAccess);
        this.app.use(function (error, req, res, next) {
            if (error.name === 'UnauthorizedError') {
                res.status(401).send('Invalid Access Token');
            }
        });
        // Set our authenticated api routes
        this.app.use('/', drivers_1.ExpressAuthRouteDriver.buildRouter(dataStore, fileManager, library));
        // Set admin api routes
        this.app.use(admin_access_1.enforceAdminAccess);
        this.app.use('/admin', drivers_1.ExpressAdminRouteDriver.buildRouter(dataStore, fileManager, library));
        /**
         * Get port from environment and store in Express.
         */
        var port = process.env.PORT || '3000';
        this.app.set('port', port);
        // Allow Proxy
        this.app.set('trust proxy', true);
        /**
         * Create HTTP server.
         */
        var server = http.createServer(this.app);
        /**
         * Listen on provided port, on all network interfaces.
         */
        server.listen(port, function () {
            return console.log("Learning Object Service running on localhost:" + port);
        });
        return this.app;
    };
    ExpressDriver.app = express();
    return ExpressDriver;
}());
exports.ExpressDriver = ExpressDriver;
