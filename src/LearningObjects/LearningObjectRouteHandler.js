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
var LearningObjectInteractor = require("./LearningObjectInteractor");
var express_1 = require("express");
var clark_entity_1 = require("@cyber4all/clark-entity");
/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Object.
 */
function initialize(_a) {
    var _this = this;
    var dataStore = _a.dataStore, fileManager = _a.fileManager, library = _a.library;
    var router = express_1.Router();
    var addLearningObject = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var username, object, learningObject, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    username = req.user.username;
                    object = clark_entity_1.LearningObject.instantiate(req.body.object);
                    object.author.username = username;
                    return [4 /*yield*/, LearningObjectInteractor.addLearningObject(dataStore, fileManager, object)];
                case 1:
                    learningObject = _a.sent();
                    res.status(200).send(learningObject);
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error(e_1);
                    res.status(500).send(e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var updateLearningObject = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var object, user, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    object = clark_entity_1.LearningObject.instantiate(req.body.learningObject);
                    user = req.user;
                    if (!(user.username === object.author.username)) return [3 /*break*/, 2];
                    return [4 /*yield*/, LearningObjectInteractor.updateLearningObject(dataStore, fileManager, object.id, object)];
                case 1:
                    _a.sent();
                    res.sendStatus(200);
                    return [3 /*break*/, 3];
                case 2:
                    res.status(403).send('Invalid access. Could not update Learning Object');
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
    }); };
    var deleteLearningObject = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var learningObjectName, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    learningObjectName = req.params.learningObjectName;
                    return [4 /*yield*/, LearningObjectInteractor.deleteLearningObject(dataStore, fileManager, req.user.username, learningObjectName, library)];
                case 1:
                    _a.sent();
                    res.sendStatus(200);
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    console.error(e_3);
                    res.status(500).send(e_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    router
        .route('/learning-objects')
        .post(addLearningObject)
        .patch(updateLearningObject);
    router["delete"]('/learning-objects/:learningObjectName', deleteLearningObject);
    return router;
}
exports.initialize = initialize;
