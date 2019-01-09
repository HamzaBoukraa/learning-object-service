"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var multer = require("multer");
var interactors_1 = require("../../interactors/interactors");
var LearningObjectInteractor_1 = require("../../LearningObjects/LearningObjectInteractor");
var LearningObjectRouteHandler = require("../../LearningObjects/LearningObjectRouteHandler");
var SubmissionRouteDriver = require("../../LearningObjectSubmission/SubmissionRouteDriver");
var SentryConnector_1 = require("../SentryConnector");
var ExpressAuthRouteDriver = /** @class */ (function () {
    function ExpressAuthRouteDriver(dataStore, fileManager, library) {
        this.dataStore = dataStore;
        this.fileManager = fileManager;
        this.library = library;
        this.upload = multer({ storage: multer.memoryStorage() });
    }
    ExpressAuthRouteDriver.buildRouter = function (dataStore, fileManager, library) {
        var e = new ExpressAuthRouteDriver(dataStore, fileManager, library);
        var router = express_1.Router();
        e.setRoutes(router);
        return router;
    };
    ExpressAuthRouteDriver.prototype.setRoutes = function (router) {
        var _this = this;
        router.use(function (req, res, next) {
            // If the username in the cookie is not lowercase and error will be reported
            // and the value adjusted to be lowercase
            if (!req.user.SERVICE_KEY &&
                !(req.user.username === req.user.username.toLowerCase())) {
                // This odd try/catch setup is so that we don't abort the current operation,
                // but still have Sentry realize that an error was thrown.
                try {
                    throw new Error(req.user.username + " was retrieved from the token. Should be lowercase");
                }
                catch (e) {
                    console.log(e.message);
                    SentryConnector_1.reportError(e);
                }
                req.user.username = req.user.username.toLowerCase();
            }
            next();
        });
        router.use('', SubmissionRouteDriver.initialize(this.dataStore));
        router.use('', LearningObjectRouteHandler.initialize({
            dataStore: this.dataStore,
            fileManager: this.fileManager,
            library: this.library
        }));
        router.get('/learning-objects/summary', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var children, objects, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        children = req.query.children;
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.loadLearningObjectSummary(this.dataStore, this.library, req.user.username, true, children, req.query)];
                    case 1:
                        objects = _a.sent();
                        res.status(200).send(objects);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        res.status(500).send(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.patch('/learning-objects/:learningObjectId/collections', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var learningObjectId, collection;
            return __generator(this, function (_a) {
                learningObjectId = req.params.learningObjectId;
                collection = req.body.collection;
                try {
                    interactors_1.LearningObjectInteractor.addToCollection(this.dataStore, learningObjectId, collection);
                    res.sendStatus(200);
                }
                catch (e) {
                    console.error(e);
                    res.status(500).send(e);
                }
                return [2 /*return*/];
            });
        }); });
        router.get('/learning-objects/:username/:learningObjectName/id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user, username, learningObjectName, id, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        user = req.user;
                        username = req.params.username;
                        learningObjectName = req.params.learningObjectName;
                        if (!(this.hasAccess(user, 'username', username) || user.SERVICE_KEY)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.findLearningObject(this.dataStore, username, learningObjectName)];
                    case 1:
                        id = _a.sent();
                        res.status(200).send(id);
                        return [3 /*break*/, 3];
                    case 2:
                        res
                            .status(403)
                            .send('Invalid Access. Cannot fetch Learning Object ID.');
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        console.error(e_2);
                        res.status(500).send(e_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
        router.post('/learning-objects/:id/files', this.upload.any(), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var file, id, dzMetadata, upload, user, loFile, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        file = req.files[0];
                        id = req.params.id;
                        dzMetadata = req.body;
                        upload = __assign({}, dzMetadata, { name: file.originalname, encoding: file.encoding, buffer: file.buffer, mimetype: file.mimetype, size: dzMetadata.dztotalfilesize || dzMetadata.size });
                        user = req.user;
                        if (!this.hasAccess(user, 'emailVerified', true)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.uploadFile({
                                id: id,
                                username: user.username,
                                dataStore: this.dataStore,
                                fileManager: this.fileManager,
                                file: upload
                            })];
                    case 1:
                        loFile = _a.sent();
                        res.status(200).send(loFile);
                        return [3 /*break*/, 3];
                    case 2:
                        res
                            .status(403)
                            .send('Invalid Access. User must be verified to upload materials.');
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        console.error(e_3);
                        res.status(500).send(e_3);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
        router["delete"]('/learning-objects/:id/files', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var uploadStatusId, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        uploadStatusId = req.body.uploadId;
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.cancelUpload({
                                uploadStatusId: uploadStatusId,
                                dataStore: this.dataStore,
                                fileManager: this.fileManager
                            })];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _a.sent();
                        console.error(e_4);
                        res.status(500).send(e_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router["delete"]('/files/:id/:filename', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, filename, username, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        filename = req.params.filename;
                        username = req.user.username;
                        return [4 /*yield*/, LearningObjectInteractor_1.deleteFile(this.fileManager, id, username, filename)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
                        return [3 /*break*/, 3];
                    case 2:
                        e_5 = _a.sent();
                        console.error(e_5);
                        res.status(500).send(e_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.patch('/learning-objects/:id/pdf', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, object, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        id = req.params.id;
                        return [4 /*yield*/, LearningObjectInteractor_1.updateReadme({
                                id: id,
                                dataStore: this.dataStore,
                                fileManager: this.fileManager
                            })];
                    case 1:
                        object = _a.sent();
                        return [4 /*yield*/, LearningObjectInteractor_1.updateLearningObject(this.dataStore, this.fileManager, id, object)];
                    case 2:
                        _a.sent();
                        res.sendStatus(200);
                        return [3 /*break*/, 4];
                    case 3:
                        e_6 = _a.sent();
                        console.error(e_6);
                        res.status(500).send(e_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        router
            .route('/learning-objects/:username/:learningObjectName/children')
            .post(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var username, user, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        username = req.params.username;
                        user = req.user;
                        if (!this.hasAccess(user, 'username', username)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.setChildren({
                                dataStore: this.dataStore,
                                children: req.body.children,
                                parentName: req.params.learningObjectName,
                                username: user.username
                            })];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
                        return [3 /*break*/, 3];
                    case 2:
                        res.status(403).send('Invalid Access. Could not add child object.');
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        e_7 = _a.sent();
                        console.error(e_7);
                        res.status(500).send(e_7);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); })["delete"](function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user, username, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        user = req.user;
                        username = req.params.username;
                        if (!this.hasAccess(user, 'username', username)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.removeChild({
                                dataStore: this.dataStore,
                                childId: req.body.id,
                                parentName: req.params.learningObjectName,
                                username: user.username
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        res.sendStatus(200);
                        return [3 /*break*/, 4];
                    case 3:
                        e_8 = _a.sent();
                        console.error(e_8);
                        res.status(500).send(e_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        router["delete"]('/learning-objects/:learningObjectNames/multiple', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var learningObjectNames, e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        learningObjectNames = req.params.learningObjectNames.split(',');
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.deleteMultipleLearningObjects(this.dataStore, this.fileManager, this.library, req.user.username, learningObjectNames)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
                        return [3 /*break*/, 3];
                    case 2:
                        e_9 = _a.sent();
                        console.error(e_9);
                        res.status(500).send(e_9);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // TODO: Need to validate token and that it is coming from cart service
        router.get('/cart/learning-objects/:ids/summary', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var ids, objects, e_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        ids = req.params.ids.split(',');
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchObjectsByIDs(this.dataStore, this.library, ids)];
                    case 1:
                        objects = _a.sent();
                        res.status(200).send(objects);
                        return [3 /*break*/, 3];
                    case 2:
                        e_10 = _a.sent();
                        console.error(e_10);
                        res.status(500).send(e_10);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // TODO: Need to validate token and that it is coming from cart service
        router.get('/cart/learning-objects/:ids/full', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var ids, objects, e_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        ids = req.params.ids.split(',');
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.loadFullLearningObjectByIDs(this.dataStore, this.library, ids)];
                    case 1:
                        objects = _a.sent();
                        res.status(200).send(objects);
                        return [3 /*break*/, 3];
                    case 2:
                        e_11 = _a.sent();
                        console.error(e_11);
                        res.status(500).send(e_11);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    ExpressAuthRouteDriver.prototype.hasAccess = function (token, propName, value) {
        return token[propName] === value;
    };
    return ExpressAuthRouteDriver;
}());
exports.ExpressAuthRouteDriver = ExpressAuthRouteDriver;
