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
var MongoDriver_1 = require("../drivers/MongoDriver");
var ObjectMapper = require("../drivers/Mongo/ObjectMapper");
var learning_object_1 = require("@cyber4all/clark-entity/dist/learning-object");
var ERROR_MESSAGE = {
    INVALID_ACCESS: "Invalid access. User must be verified to publish Learning Objects",
    RESTRICTED: "Unable to publish. Learning Object locked by reviewer."
};
var SubmissionDatastore = /** @class */ (function () {
    function SubmissionDatastore(db) {
        this.db = db;
    }
    SubmissionDatastore.prototype.togglePublished = function (username, id, published) {
        return __awaiter(this, void 0, void 0, function () {
            var user, object, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.fetchUser(username)];
                    case 1:
                        user = _a.sent();
                        // check if user is verified and if user is attempting to publish. If not verified and attempting to publish reject
                        if (!user.emailVerified && published)
                            return [2 /*return*/, Promise.reject(ERROR_MESSAGE.INVALID_ACCESS)];
                        return [4 /*yield*/, this.db
                                .collection(MongoDriver_1.COLLECTIONS.LearningObject.name)
                                .findOne({ _id: id }, { _id: 0, lock: 1 })];
                    case 2:
                        object = _a.sent();
                        if (this.objectHasRestrictions(object.lock)) {
                            return [2 /*return*/, Promise.reject(ERROR_MESSAGE.RESTRICTED)];
                        }
                        return [4 /*yield*/, this.db
                                .collection(MongoDriver_1.COLLECTIONS.LearningObject.name)
                                .update({ _id: id }, { $set: { published: published, status: published ? 'waiting' : 'unpublished' } })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 4:
                        e_1 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_1)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SubmissionDatastore.prototype.objectHasRestrictions = function (lock) {
        return lock &&
            (lock.restrictions.indexOf(learning_object_1.Restriction.FULL) > -1 ||
                lock.restrictions.indexOf(learning_object_1.Restriction.PUBLISH) > -1);
    };
    // TODO: Should this be an external helper?
    SubmissionDatastore.prototype.fetchUser = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var doc, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchUserDocument(MongoDriver_1.COLLECTIONS.User, username)];
                    case 1:
                        doc = _a.sent();
                        user = ObjectMapper.generateUser(doc);
                        return [2 /*return*/, user];
                }
            });
        });
    };
    SubmissionDatastore.prototype.fetchUserDocument = function (collection, username) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .collection(collection.name)
                            .findOne({ username: username })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Problem fetching a ' +
                                    collection.name +
                                    ':\n\tInvalid username ' +
                                    JSON.stringify(username))];
                        return [2 /*return*/, Promise.resolve(record)];
                }
            });
        });
    };
    return SubmissionDatastore;
}());
exports.SubmissionDatastore = SubmissionDatastore;
