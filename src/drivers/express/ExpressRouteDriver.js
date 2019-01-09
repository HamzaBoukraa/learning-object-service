"use strict";
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
var interactors_1 = require("../../interactors/interactors");
var TokenManager = require("../TokenManager");
var SentryConnector_1 = require("../SentryConnector");
var LearningObjectStatsRouteHandler = require("../../LearningObjectStats/LearningObjectStatsRouteHandler");
var routes_1 = require("../../routes");
var filenotfound_1 = require("../../assets/filenotfound");
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
var version = require('../../../package.json').version;
var ExpressRouteDriver = /** @class */ (function () {
    function ExpressRouteDriver(dataStore, library, fileManager) {
        this.dataStore = dataStore;
        this.library = library;
        this.fileManager = fileManager;
    }
    ExpressRouteDriver.buildRouter = function (dataStore, library, fileManager) {
        var e = new ExpressRouteDriver(dataStore, library, fileManager);
        var router = express_1.Router();
        e.setRoutes(router);
        return router;
    };
    ExpressRouteDriver.prototype.setRoutes = function (router) {
        var _this = this;
        router.get('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                res.json({
                    version: version,
                    message: "Welcome to the Learning Objects' API v" + version
                });
                return [2 /*return*/];
            });
        }); });
        router.route('/learning-objects').get(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var currPage, limit, status_1, name_1, author, collection, length_1, level, standardOutcomes, released, text, orderBy, sortType, learningObjects, accessUnpublished, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        currPage = req.query.currPage ? +req.query.currPage : null;
                        limit = req.query.limit ? +req.query.limit : null;
                        status_1 = req.query.status ? req.query.status : null;
                        name_1 = req.query.name;
                        author = req.query.author;
                        collection = req.query.collection;
                        length_1 = req.query.length;
                        length_1 = length_1 && !Array.isArray(length_1) ? [length_1] : length_1;
                        level = req.query.level;
                        level = level && !Array.isArray(level) ? [level] : level;
                        standardOutcomes = req.query.standardOutcomes;
                        standardOutcomes =
                            standardOutcomes && !Array.isArray(standardOutcomes)
                                ? [standardOutcomes]
                                : standardOutcomes;
                        released = req.query.released;
                        text = req.query.text;
                        orderBy = req.query.orderBy;
                        sortType = req.query.sortType ? +req.query.sortType : null;
                        learningObjects = void 0;
                        accessUnpublished = false;
                        if (!(name_1 ||
                            author ||
                            collection ||
                            length_1 ||
                            level ||
                            standardOutcomes ||
                            text ||
                            orderBy ||
                            sortType ||
                            released)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.searchObjects(this.dataStore, this.library, {
                                name: name_1,
                                author: author,
                                collection: collection,
                                status: status_1,
                                length: length_1,
                                level: level,
                                standardOutcomeIDs: standardOutcomes,
                                text: text,
                                accessUnpublished: accessUnpublished,
                                orderBy: orderBy,
                                sortType: sortType,
                                currPage: currPage,
                                limit: limit,
                                released: released
                            })];
                    case 1:
                        learningObjects = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchAllObjects(this.dataStore, this.library, currPage, limit)];
                    case 3:
                        learningObjects = _a.sent();
                        _a.label = 4;
                    case 4:
                        res.status(200).send(learningObjects);
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.log(e_1);
                        res.status(500).send(e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        router.get('/learning-objects/:id/parents', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var query, parents, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = req.query;
                        query.id = req.params.id;
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchParents({
                                query: query,
                                dataStore: this.dataStore
                            })];
                    case 1:
                        parents = _a.sent();
                        res.status(200).send(parents);
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        console.error(e_2);
                        res.status(500).send(e_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router
            .route('/learning-objects/:username/:learningObjectName')
            .get(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var accessUnpublished, username, cookie, user, object, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        accessUnpublished = false;
                        username = req.params.username;
                        cookie = req.cookies.presence;
                        if (!cookie) return [3 /*break*/, 2];
                        return [4 /*yield*/, TokenManager.decode(cookie)];
                    case 1:
                        user = _a.sent();
                        accessUnpublished = user.username === username ? true : false;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, interactors_1.LearningObjectInteractor.loadLearningObject(this.dataStore, this.library, username, req.params.learningObjectName, accessUnpublished)];
                    case 3:
                        object = _a.sent();
                        res.status(200).send(object);
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        console.error(e_3);
                        res.status(500).send(e_3);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
        /**
         * Return all collections {name: string, abvName: string, primaryColor: string, hasLogo: boolean}
         */
        router.get('/collections', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var collections, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchCollections(this.dataStore)];
                    case 1:
                        collections = _a.sent();
                        res.status(200).send(collections);
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
        /**
         * Return a full collection {name: string, abstracts: [], learningObjects: []}
         */
        router.get('/collections/:name', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var name_2, collection, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        name_2 = req.params.name;
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchCollection(this.dataStore, name_2)];
                    case 1:
                        collection = _a.sent();
                        res.status(200).send(collection);
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
        /**
         * Return a list of learningObjects from a collection
         */
        router.get('/collections/:name/learning-objects', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var objects, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchCollectionObjects(this.dataStore, req.params.name)];
                    case 1:
                        objects = _a.sent();
                        res.status(200).send(objects);
                        return [3 /*break*/, 3];
                    case 2:
                        e_6 = _a.sent();
                        console.error(e_6);
                        res.status(500).send(e_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        /**
         * Return the name of a collection and a list of it's abstracts
         */
        router.get('/collections/:name/meta', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var collectionMeta, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.fetchCollectionMeta(this.dataStore, req.params.name)];
                    case 1:
                        collectionMeta = _a.sent();
                        res.status(200).send(collectionMeta);
                        return [3 /*break*/, 3];
                    case 2:
                        e_7 = _a.sent();
                        console.error(e_7);
                        res.status(500).send(e_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.get('/users/:username/learning-objects', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var objects, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.loadLearningObjectSummary(this.dataStore, this.library, req.params.username, false)];
                    case 1:
                        objects = _a.sent();
                        res.status(200).send(objects);
                        return [3 /*break*/, 3];
                    case 2:
                        e_8 = _a.sent();
                        console.error(e_8);
                        res.status(500).send(e_8);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.get('/users/:username/learning-objects/:loId/files/:fileId/download', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var open_1, author, loId, fileId, _a, filename, mimeType, stream, e_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        open_1 = req.query.open;
                        author = req.params.username;
                        loId = req.params.loId;
                        fileId = req.params.fileId;
                        return [4 /*yield*/, interactors_1.LearningObjectInteractor.downloadSingleFile({
                                author: author,
                                fileId: fileId,
                                dataStore: this.dataStore,
                                fileManager: this.fileManager,
                                learningObjectId: loId
                            })];
                    case 1:
                        _a = _b.sent(), filename = _a.filename, mimeType = _a.mimeType, stream = _a.stream;
                        if (!open_1) {
                            res.attachment(filename);
                        }
                        // Set mime type only if it is known
                        if (mimeType)
                            res.contentType(mimeType);
                        stream.pipe(res);
                        return [3 /*break*/, 3];
                    case 2:
                        e_9 = _b.sent();
                        if (e_9.message === 'Invalid Access') {
                            res
                                .status(403)
                                .send('Invalid Access. You do not have download privileges for this file');
                        }
                        else if (e_9.message === 'File not found') {
                            fileNotFoundResponse(e_9.object, req, res);
                        }
                        else {
                            console.error(e_9);
                            SentryConnector_1.reportError(e_9);
                            res.status(500).send('Internal Server Error');
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.use('/learning-objects/stats', LearningObjectStatsRouteHandler.initialize({
            dataStore: this.dataStore,
            library: this.library
        }));
    };
    return ExpressRouteDriver;
}());
exports.ExpressRouteDriver = ExpressRouteDriver;
function fileNotFoundResponse(object, req, res) {
    var redirectUrl = routes_1.LEARNING_OBJECT_ROUTES.CLARK_DETAILS({
        objectName: object.name,
        username: req.params.username
    });
    res.status(404).type('text/html').send(filenotfound_1.fileNotFound(redirectUrl));
}
