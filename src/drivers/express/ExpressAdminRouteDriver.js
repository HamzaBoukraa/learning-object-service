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
var clark_entity_1 = require("@cyber4all/clark-entity");
var express_1 = require("express");
var interactors_1 = require("../../interactors/interactors");
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
var version = require('../../../package.json').version;
var ExpressAdminRouteDriver = /** @class */ (function () {
    function ExpressAdminRouteDriver(dataStore, fileManager, library) {
        this.dataStore = dataStore;
        this.fileManager = fileManager;
        this.library = library;
    }
    ExpressAdminRouteDriver.buildRouter = function (dataStore, fileManager, library) {
        var e = new ExpressAdminRouteDriver(dataStore, fileManager, library);
        var router = express_1.Router();
        e.setRoutes(router);
        return router;
    };
    ExpressAdminRouteDriver.prototype.setRoutes = function (router) {
        var _this = this;
        router.get('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                res.json({
                    version: version,
                    message: "Welcome to the Learning Objects' Admin API v" + version
                });
                return [2 /*return*/];
            });
        }); });
        router.route('/learning-objects').get(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var page, limit, name_1, author, length_1, level, standardOutcomes, text, orderBy, sortType, learningObjects, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        page = req.query.page ? +req.query.page : null;
                        limit = req.query.limit ? +req.query.limit : null;
                        name_1 = req.query.name;
                        author = req.query.author;
                        length_1 = req.query.length;
                        length_1 = length_1 && !Array.isArray(length_1) ? [length_1] : length_1;
                        level = req.query.level;
                        level = level && !Array.isArray(level) ? [level] : level;
                        standardOutcomes = req.query.standardOutcomes;
                        standardOutcomes =
                            standardOutcomes && !Array.isArray(standardOutcomes)
                                ? [standardOutcomes]
                                : standardOutcomes;
                        text = req.query.text;
                        orderBy = req.query.orderBy;
                        sortType = req.query.sortType ? +req.query.sortType : null;
                        learningObjects = void 0;
                        if (!(name_1 ||
                            author ||
                            length_1 ||
                            level ||
                            standardOutcomes ||
                            text ||
                            orderBy ||
                            sortType)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.searchObjects(this.dataStore, this.library, name_1, author, length_1, level, standardOutcomes, text, orderBy, sortType, page, limit)];
                    case 1:
                        learningObjects = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.fetchAllObjects(this.dataStore, page, limit)];
                    case 3:
                        learningObjects = _a.sent();
                        _a.label = 4;
                    case 4:
                        res.status(200).send(learningObjects);
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.error(e_1);
                        res.status(500).send(e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        router.route('/learning-objects').patch(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var learningObject, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        learningObject = clark_entity_1.LearningObject.instantiate(req.body);
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.updateLearningObject(this.dataStore, this.fileManager, learningObject.id, learningObject)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
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
        router.route('/learning-objects/:learningObjectId').get(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, learningObject, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.learningObjectId;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.loadFullLearningObject(this.dataStore, this.fileManager, this.library, id)];
                    case 1:
                        learningObject = _a.sent();
                        res.status(200).send(learningObject);
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        console.error(e_3);
                        res.status(500).send(e_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        router.patch('/users/:username/learning-objects/:learningObjectName/publish', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, published, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.body.id;
                        published = req.body.published;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.togglePublished(this.dataStore, req.params.username, id, published)];
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
        router.patch('/users/:username/learning-objects/:learningObjectName/unpublish', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, published, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.body.id;
                        published = req.body.published;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.togglePublished(this.dataStore, req.params.username, id, published)];
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
        router.patch('/users/:username/learning-objects/:learningObjectName/lock', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, lock, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.body.id;
                        lock = req.body.lock;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.toggleLock(this.dataStore, id, lock)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
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
        router.patch('/users/:username/learning-objects/:learningObjectName/unlock', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.body.id;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.toggleLock(this.dataStore, id)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
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
        router["delete"]('/users/:username/learning-objects/:learningObjectName', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var learningObjectName, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        learningObjectName = req.params.learningObjectName;
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.deleteLearningObject(this.dataStore, this.fileManager, req.params.username, learningObjectName)];
                    case 1:
                        _a.sent();
                        res.sendStatus(200);
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
        router["delete"]('/learning-objects/:learningObjectNames/multiple', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var learningObjectNames, e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        learningObjectNames = req.params.learningObjectNames.split(',');
                        return [4 /*yield*/, interactors_1.AdminLearningObjectInteractor.deleteMultipleLearningObjects(this.dataStore, this.fileManager, req.params.username, learningObjectNames)];
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
    };
    return ExpressAdminRouteDriver;
}());
exports.ExpressAdminRouteDriver = ExpressAdminRouteDriver;
