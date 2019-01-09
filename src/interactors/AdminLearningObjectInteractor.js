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
var interactors_1 = require("./interactors");
var LearningObjectInteractor_1 = require("../LearningObjects/LearningObjectInteractor");
var AdminLearningObjectInteractor = /** @class */ (function () {
    function AdminLearningObjectInteractor() {
    }
    /**
     * Return literally all objects
     * @returns {LearningObject[]} array of all objects
     */
    AdminLearningObjectInteractor.fetchAllObjects = function (dataStore, currPage, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var accessUnpublished, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        accessUnpublished = true;
                        return [4 /*yield*/, dataStore.fetchAllObjects(accessUnpublished, currPage, limit)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching all Learning Objects. Error: " + e_1)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Search for objects by name, author, length, level, and content.
     *
     * @param {string} name the objects' names should closely relate
     * @param {string} author the objects' authors' names` should closely relate
     * @param {string} length the objects' lengths should match exactly
     * @param {string} level the objects' levels should match exactly TODO: implement
     * @param {boolean} ascending whether or not result should be in ascending order
     *
     * @returns {Outcome[]} list of outcome suggestions, ordered by score
     */
    AdminLearningObjectInteractor.searchObjects = function (dataStore, library, name, author, length, level, standardOutcomeIDs, text, orderBy, sortType, page, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var accessUnpublished, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        accessUnpublished = true;
                        return [4 /*yield*/, this.learningObjectInteractor.searchObjects(dataStore, library, {
                                name: name,
                                author: author,
                                collection: undefined,
                                status: undefined,
                                length: length,
                                level: level,
                                standardOutcomeIDs: standardOutcomeIDs,
                                text: text,
                                accessUnpublished: accessUnpublished,
                                orderBy: orderBy,
                                sortType: sortType,
                                currPage: page,
                                limit: limit
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_2 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem searching Learning Objects. Error:" + e_2)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.loadFullLearningObject = function (dataStore, fileManager, library, learningObjectID) {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.fetchLearningObject(learningObjectID, true, true)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_3)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.togglePublished = function (dataStore, username, id, published) {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.learningObjectInteractor.togglePublished(dataStore, username, id, published)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_4 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem toggling publish status. Error:  " + e_4)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.toggleLock = function (dataStore, id, lock) {
        return __awaiter(this, void 0, void 0, function () {
            var e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.toggleLock(id, lock)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_5 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem toggling lock. Error:  " + e_5)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.deleteLearningObject = function (dataStore, fileManager, username, learningObjectName) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.learningObjectInteractor.deleteLearningObject(dataStore, fileManager, username, learningObjectName)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem deleting Learning Object. Error: " + error_1)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.deleteMultipleLearningObjects = function (dataStore, fileManager, library, username, learningObjectIDs) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.learningObjectInteractor.deleteMultipleLearningObjects(dataStore, fileManager, library, username, learningObjectIDs)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem deleting Learning Objects. Error: " + error_2)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.updateLearningObject = function (dataStore, fileManager, id, learningObject) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, LearningObjectInteractor_1.updateLearningObject(dataStore, fileManager, id, learningObject)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(error_3)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminLearningObjectInteractor.learningObjectInteractor = interactors_1.LearningObjectInteractor;
    return AdminLearningObjectInteractor;
}());
exports.AdminLearningObjectInteractor = AdminLearningObjectInteractor;
