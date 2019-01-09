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
var mongodb_1 = require("mongodb");
var clark_entity_1 = require("@cyber4all/clark-entity");
var learning_object_1 = require("@cyber4all/clark-entity/dist/learning-object");
var SentryConnector_1 = require("./SentryConnector");
var ObjectMapper = require("./Mongo/ObjectMapper");
var SubmissionDatastore_1 = require("../LearningObjectSubmission/SubmissionDatastore");
var LearningObjectStatStore_1 = require("../LearningObjectStats/LearningObjectStatStore");
var COLLECTIONS = /** @class */ (function () {
    function COLLECTIONS() {
    }
    COLLECTIONS.User = {
        name: 'users',
        foreigns: [
            {
                name: 'objects',
                data: {
                    target: 'LearningObject',
                    child: true
                }
            },
        ],
        uniques: ['username']
    };
    COLLECTIONS.LearningObject = {
        name: 'objects',
        foreigns: [
            {
                name: 'authorID',
                data: {
                    target: 'User',
                    child: false,
                    registry: 'objects'
                }
            },
            {
                name: 'outcomes',
                data: {
                    target: 'LearningOutcome',
                    child: true,
                    registry: 'source'
                }
            },
        ]
    };
    COLLECTIONS.LearningOutcome = {
        name: 'learning-outcomes',
        foreigns: [
            {
                name: 'source',
                data: {
                    target: 'LearningObject',
                    child: false,
                    registry: 'outcomes'
                }
            },
        ]
    };
    COLLECTIONS.StandardOutcome = { name: 'outcomes' };
    COLLECTIONS.LearningObjectCollection = { name: 'collections' };
    COLLECTIONS.MultipartUploadStatusCollection = {
        name: 'multipart-upload-statuses'
    };
    return COLLECTIONS;
}());
exports.COLLECTIONS = COLLECTIONS;
var COLLECTIONS_MAP = new Map();
COLLECTIONS_MAP.set('User', COLLECTIONS.User);
COLLECTIONS_MAP.set('LearningObject', COLLECTIONS.LearningObject);
COLLECTIONS_MAP.set('LearningOutcome', COLLECTIONS.LearningOutcome);
COLLECTIONS_MAP.set('StandardOutcome', COLLECTIONS.StandardOutcome);
COLLECTIONS_MAP.set('LearningObjectCollection', COLLECTIONS.LearningObjectCollection);
COLLECTIONS_MAP.set('MultipartUploadStatusCollection', COLLECTIONS.MultipartUploadStatusCollection);
var MongoDriver = /** @class */ (function () {
    function MongoDriver(dburi) {
        var _this = this;
        this.connect(dburi).then(function () {
            _this.submissionStore = new SubmissionDatastore_1.SubmissionDatastore(_this.db);
            _this.statStore = new LearningObjectStatStore_1.LearningObjectStatStore(_this.db);
        });
    }
    MongoDriver.prototype.togglePublished = function (username, id, published) {
        return this.submissionStore.togglePublished(username, id, published);
    };
    /**
     * Connect to the database. Must be called before any other functions.
     * @async
     *
     * NOTE: This function will attempt to connect to the database every
     *       time it is called, but since it assigns the result to a local
     *       variable which can only ever be created once, only one
     *       connection will ever be active at a time.
     *
     * TODO: Verify that connections are automatically closed
     *       when they no longer have a reference.
     *
     * @param {string} dbIP the host and port on which mongodb is running
     */
    MongoDriver.prototype.connect = function (dbURI, retryAttempt) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, mongodb_1.MongoClient.connect(dbURI)];
                    case 1:
                        _a.mongoClient = _b.sent();
                        this.db = this.mongoClient.db();
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _b.sent();
                        if (!retryAttempt) {
                            this.connect(dbURI, 1);
                        }
                        else {
                            return [2 /*return*/, Promise.reject('Problem connecting to database at ' + dbURI + ':\n\t' + e_1)];
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close the database. Note that this will affect all services
     * and scripts using the database, so only do this if it's very
     * important or if you are sure that *everything* is finished.
     */
    MongoDriver.prototype.disconnect = function () {
        this.mongoClient.close();
    };
    /////////////
    // INSERTS //
    /////////////
    /**
     * Insert a learning object into the database.
     * @async
     *
     * @param {LearningObjectInsert} object
     *
     * @returns {LearningObjectID} the database id of the new record
     */
    MongoDriver.prototype.insertLearningObject = function (object) {
        return __awaiter(this, void 0, void 0, function () {
            var authorID, author, doc, id, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.findUser(object.author.username)];
                    case 1:
                        authorID = _a.sent();
                        return [4 /*yield*/, this.fetchUser(authorID)];
                    case 2:
                        author = _a.sent();
                        if (!author.emailVerified) {
                            object.unpublish();
                        }
                        object.lock = {
                            restrictions: [learning_object_1.Restriction.DOWNLOAD]
                        };
                        return [4 /*yield*/, this.documentLearningObject(object, true)];
                    case 3:
                        doc = _a.sent();
                        return [4 /*yield*/, this.insert(COLLECTIONS.LearningObject, doc)];
                    case 4:
                        id = _a.sent();
                        return [4 /*yield*/, this.insertLearningOutcomes({
                                learningObjectID: id,
                                learningObjectName: object.name,
                                authorName: author.name
                            }, object.outcomes)];
                    case 5:
                        _a.sent();
                        // FIXME: ID is wrong
                        return [2 /*return*/, id];
                    case 6:
                        e_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_2)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates or inserts LearningObjectFile into learning object's files array
     *
     * @param {{
     *     id: string;
     *     loFile: LearningObjectFile;
     *   }} params
     * @returns {Promise<void>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.addToFiles = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var existingDoc, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .findOneAndUpdate({ _id: params.id, 'materials.files.url': params.loFile.url }, { $set: { 'materials.files.$[element]': params.loFile } }, 
                            // @ts-ignore: arrayFilters is in fact a property defined by documentation. Property does not exist in type definition.
                            { arrayFilters: [{ 'element.url': params.loFile.url }] })];
                    case 1:
                        existingDoc = _a.sent();
                        if (!!existingDoc.value) return [3 /*break*/, 3];
                        if (!params.loFile.id) {
                            params.loFile.id = new mongodb_1.ObjectID().toHexString();
                        }
                        return [4 /*yield*/, this.db.collection(COLLECTIONS.LearningObject.name).updateOne({
                                _id: params.id
                            }, { $push: { 'materials.files': params.loFile } })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, Promise.resolve()];
                    case 4:
                        e_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_3)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.insertMultipartUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.MultipartUploadStatusCollection.name)
                                .insertOne(params.status)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_4 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_4)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.fetchMultipartUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.MultipartUploadStatusCollection.name)
                                .findOne({ _id: params.id })];
                    case 1:
                        status_1 = _a.sent();
                        return [2 /*return*/, status_1];
                    case 2:
                        e_5 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_5)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.updateMultipartUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.MultipartUploadStatusCollection.name)
                                .updateOne({ _id: params.id }, {
                                $set: params.updates,
                                $push: { completedParts: params.completedPart }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_6 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_6)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.deleteMultipartUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.MultipartUploadStatusCollection.name)
                                .deleteOne({ _id: params.id })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_7 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_7)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Inserts a child id into a learning object's children array if the child object
     * exists in the LearningObject collection.
     *
     * @async
     * @param {string} parentId The database ID of the parent Learning Object
     * @param {string} childId The database ID of the child Learning Object
     * @memberof MongoDriver
     */
    MongoDriver.prototype.setChildren = function (parentId, children) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, parentObject, childrenObjects, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        collection = this.db.collection(COLLECTIONS.LearningObject.name);
                        return [4 /*yield*/, collection.findOne({ _id: parentId })];
                    case 1:
                        parentObject = _a.sent();
                        return [4 /*yield*/, collection
                                .find({ _id: { $in: children } })
                                .toArray()];
                    case 2:
                        childrenObjects = _a.sent();
                        if (!(childrenObjects.length !== children.length)) return [3 /*break*/, 3];
                        return [2 /*return*/, Promise.reject({
                                message: "One or more of the children id's does not exist",
                                status: 404
                            })];
                    case 3:
                        if (!this.checkChildrenLength(parentObject, childrenObjects)) {
                            // at least one of the children is of an equal or greater length than the parent
                            return [2 /*return*/, Promise.reject({
                                    message: "One or more of the children objects are of a length greater than or equal to the parent objects length",
                                    status: 400
                                })];
                        }
                        parentObject.children = children;
                        // replace children array of parent with passed children array
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .findOneAndUpdate({ _id: parentId }, { $set: { children: children } }, { upsert: true })];
                    case 4:
                        // replace children array of parent with passed children array
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.log(error_1);
                        return [2 /*return*/, Promise.reject({
                                message: "Problem inserting children into Object " + parentId,
                                status: 500
                            })];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Iterates the provided array of children objects and ensure that none of them are of an equal or greater length than the parent
     * @param {LearningObject} parent Learning object to which children will be added
     * @param {LearningObject[]} children Array of learning objects to be added as children to parent
     */
    MongoDriver.prototype.checkChildrenLength = function (parent, children) {
        // FIXME: These lengths should be retrieved from a standardized source such as a npm module
        var lengths = ['nanomodule', 'micromodule', 'module', 'unit', 'course'];
        var maxLengthIndex = lengths.indexOf(parent.length);
        for (var i = 0, l = children.length; i < l; i++) {
            if (lengths.indexOf(children[i].length) >= maxLengthIndex) {
                // this learning object is of an equal or greater length than the parent
                return false;
            }
        }
        return true;
    };
    /**
     * deletes a child id from a learning object's children array if the child object
     * exists in the children array.
     *
     * @async
     * @param {string} parentId The database ID of the parent Learning Object
     * @param {string} childId The database ID of the child Learning Object
     * @memberof MongoDriver
     */
    MongoDriver.prototype.deleteChild = function (parentId, childId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .update({ _id: parentId }, { $pull: { children: childId } })
                                .then(function (res) {
                                return res.result.nModified > 0
                                    ? Promise.resolve()
                                    : Promise.reject({
                                        message: childId + " is not a child of Object " + parentId,
                                        status: 404
                                    });
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        if (error_2.message && error_2.status) {
                            return [2 /*return*/, Promise.reject(error_2)];
                        }
                        return [2 /*return*/, Promise.reject({
                                message: "Problem removing child " + childId + " from Object " + parentId,
                                status: 400
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Finds Parents of requested Object
     *
     * @param {{
     *     query: LearningObjectQuery;
     *   }} params
     * @returns {Promise<LearningObject[]>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.findParentObjects = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var cursor, parentDocs, parents, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .find({ children: params.query.id })];
                    case 1:
                        cursor = _a.sent();
                        cursor = this.applyCursorFilters(cursor, params.query);
                        return [4 /*yield*/, cursor.toArray()];
                    case 2:
                        parentDocs = _a.sent();
                        return [4 /*yield*/, this.bulkGenerateLearningObjects(parentDocs, params.query.full)];
                    case 3:
                        parents = _a.sent();
                        return [2 /*return*/, parents];
                    case 4:
                        e_8 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_8)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Insert a learning outcome into the database.
     * @async
     *
     * @param {LearningOutcomeInsert} record
     *
     * @returns {LearningOutcomeID} the database id of the new record
     */
    MongoDriver.prototype.insertLearningOutcomes = function (source, outcomes) {
        return __awaiter(this, void 0, void 0, function () {
            var e_9;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all(outcomes.map(function (outcome) { return __awaiter(_this, void 0, void 0, function () {
                                var doc;
                                return __generator(this, function (_a) {
                                    doc = this.documentLearningOutcome(outcome, source, true);
                                    return [2 /*return*/, this.insert(COLLECTIONS.LearningOutcome, doc)];
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_9 = _a.sent();
                        return [2 /*return*/, Promise.reject('Problem inserting Learning Outcomes:\n\t' + e_9)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ////////////////////////////
    // MAPPING AND REGISTRIES //
    ////////////////////////////
    /**
     * Add a mapping for an outcome.
     * @async
     *
     * @param {OutcomeID} outcome the user's outcome
     * @param {OutcomeID} mapping the newly associated outcome's id
     */
    MongoDriver.prototype.mapOutcome = function (outcome, mapping) {
        return __awaiter(this, void 0, void 0, function () {
            var target;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .collection('outcomes')
                            .findOne({ _id: mapping })];
                    case 1:
                        target = _a.sent();
                        if (!target)
                            return [2 /*return*/, Promise.reject('Registration failed: no mapping ' + mapping + 'found in outcomes')];
                        return [2 /*return*/, this.register(COLLECTIONS.LearningOutcome, outcome, 'mappings', mapping)];
                }
            });
        });
    };
    /**
     * Undo a mapping for an outcome.
     * @async
     *
     * @param {OutcomeID} outcome the user's outcome
     * @param {OutcomeID} mapping the newly associated outcome's id
     */
    MongoDriver.prototype.unmapOutcome = function (outcome, mapping) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.unregister(COLLECTIONS.LearningOutcome, outcome, 'mappings', mapping)];
            });
        });
    };
    /**
     * Reorder an outcome in an object's outcomes list.
     * @async
     *
     * @param {LearningObjectID} object the object
     * @param {LearningOutcomeID} outcome the outcome being reordered
     * @param {number} index the new index for the outcome
     */
    MongoDriver.prototype.reorderOutcome = function (object, outcome, index) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.reorder(COLLECTIONS.LearningObject, object, 'outcomes', outcome, index)];
            });
        });
    };
    ///////////////////////////////////////////////////////////////////
    // EDITS - update without touching any foreign keys or documents //
    ///////////////////////////////////////////////////////////////////
    /**
     * Edit a learning object.
     * @async
     *
     * @param {LearningObjectID} id which document to change
     * @param {LearningObjectEdit} record the values to change to
     */
    MongoDriver.prototype.editLearningObject = function (id, object) {
        return __awaiter(this, void 0, void 0, function () {
            var old, author, doc_1, outcomesToAdd_1, oldOutcomes_1, staleOutcomes, e_10;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.fetch(COLLECTIONS.LearningObject, id)];
                    case 1:
                        old = _a.sent();
                        return [4 /*yield*/, this.fetchUser(old.authorID)];
                    case 2:
                        author = _a.sent();
                        if (!author.emailVerified) {
                            object.unpublish();
                        }
                        return [4 /*yield*/, this.documentLearningObject(object, false, id)];
                    case 3:
                        doc_1 = _a.sent();
                        // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
                        return [4 /*yield*/, this.edit(COLLECTIONS.LearningObject, id, doc_1)];
                    case 4:
                        // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
                        _a.sent();
                        outcomesToAdd_1 = [];
                        oldOutcomes_1 = new Set(old.outcomes);
                        return [4 /*yield*/, Promise.all(object.outcomes.map(function (outcome) { return __awaiter(_this, void 0, void 0, function () {
                                var outcomeID, e_11;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 3, , 4]);
                                            return [4 /*yield*/, this.findLearningOutcome(id, outcome.tag)];
                                        case 1:
                                            outcomeID = _a.sent();
                                            // Remove from array of outcomes
                                            oldOutcomes_1["delete"](outcomeID);
                                            // Edit Learning Outcome
                                            return [4 /*yield*/, this.editLearningOutcome(outcomeID, outcome, {
                                                    learningObjectID: id,
                                                    learningObjectName: doc_1.name,
                                                    authorName: object.author.name
                                                })];
                                        case 2:
                                            // Edit Learning Outcome
                                            _a.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            e_11 = _a.sent();
                                            outcomesToAdd_1.push(outcome);
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 5:
                        _a.sent();
                        if (!outcomesToAdd_1.length) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.insertLearningOutcomes({
                                learningObjectID: id,
                                learningObjectName: doc_1.name,
                                authorName: object.author.name
                            }, outcomesToAdd_1)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        staleOutcomes = Array.from(oldOutcomes_1);
                        return [4 /*yield*/, Promise.all(staleOutcomes.map(function (outcomeID) {
                                return _this.remove(COLLECTIONS.LearningOutcome, outcomeID);
                            }))];
                    case 8:
                        _a.sent();
                        // ensure all outcomes have the right name_ and date tag
                        return [4 /*yield*/, this.db.collection(COLLECTIONS.LearningOutcome.name).updateMany({ source: id }, {
                                $set: {
                                    name: object.name,
                                    date: object.date
                                }
                            })];
                    case 9:
                        // ensure all outcomes have the right name_ and date tag
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 10:
                        e_10 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_10)];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.toggleLock = function (id, lock) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, e_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        updates = {
                            lock: lock
                        };
                        if (lock &&
                            (lock.restrictions.indexOf(learning_object_1.Restriction.FULL) > -1 ||
                                lock.restrictions.indexOf(learning_object_1.Restriction.PUBLISH) > -1)) {
                            updates.published = false;
                        }
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .update({ _id: id }, lock ? { $set: updates } : { $unset: { lock: null } })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_12 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_12)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Edit a learning outcome.
     * @async
     *
     * @param {LearningOutcomeID} id which document to change
     * @param {LearningOutcomeEdit} record the values to change to
     */
    MongoDriver.prototype.editLearningOutcome = function (id, outcome, source) {
        return __awaiter(this, void 0, void 0, function () {
            var doc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.documentLearningOutcome(outcome, source)];
                    case 1:
                        doc = _a.sent();
                        return [2 /*return*/, this.edit(COLLECTIONS.LearningOutcome, id, doc)];
                }
            });
        });
    };
    //////////////////////////////////////////
    // DELETIONS - will cascade to children //
    //////////////////////////////////////////
    /**
     * Remove a learning object (and its outcomes) from the database.
     * @async
     *
     * @param {LearningObjectID} id which document to delete
     */
    MongoDriver.prototype.deleteLearningObject = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // remove children references to this learning object from parent
                        return [4 /*yield*/, this.deleteLearningObjectParentReferences(id)];
                    case 1:
                        // remove children references to this learning object from parent
                        _a.sent();
                        return [4 /*yield*/, this.remove(COLLECTIONS.LearningObject, id)];
                    case 2: 
                    // now remove the object
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        e_13 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_13)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove a learning object (and its outcomes) from the database.
     * @async
     *
     * @param {LearningObjectID} id which document to delete
     */
    MongoDriver.prototype.deleteMultipleLearningObjects = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // now remove objects from database
                return [2 /*return*/, Promise.all(ids.map(function (id) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: 
                                // remove children references to this learning object from parent
                                return [4 /*yield*/, this.deleteLearningObjectParentReferences(id)];
                                case 1:
                                    // remove children references to this learning object from parent
                                    _a.sent();
                                    // now remove the object
                                    return [2 /*return*/, this.remove(COLLECTIONS.LearningObject, id)];
                            }
                        });
                    }); }))];
            });
        });
    };
    /**
     * Iterates a user's learning objects and removes children references to the specified id
     * @param id represents the learning object whose references are to be removed
     */
    MongoDriver.prototype.deleteLearningObjectParentReferences = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .collection(COLLECTIONS.LearningObject.name)
                            .findOneAndUpdate({ children: id }, { $pull: { children: id } })];
                    case 1: 
                    // remove references to learning object from parents
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Remove a learning outcome from the database.
     * @async
     *
     * @param {LearningOutcomeID} id which document to delete
     */
    MongoDriver.prototype.deleteLearningOutcome = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // find any outcomes mapping to this one, and unmap them
                        //  this data assurance step is in the general category of
                        //  'any other foreign keys pointing to this collection and id'
                        //  which is excessive enough to justify this specific solution
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningOutcome.name)
                                .updateMany({ mappings: id }, { $pull: { $mappings: id } })];
                    case 1:
                        // find any outcomes mapping to this one, and unmap them
                        //  this data assurance step is in the general category of
                        //  'any other foreign keys pointing to this collection and id'
                        //  which is excessive enough to justify this specific solution
                        _a.sent();
                        // remove this outcome
                        return [2 /*return*/, this.remove(COLLECTIONS.LearningOutcome, id)];
                    case 2:
                        e_14 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_14)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ///////////////////////////
    // INFORMATION RETRIEVAL //
    ///////////////////////////
    /**
     * Fetches Stats for Learning Objects
     *
     * @param {{ query: any }} params
     * @returns {Promise<Partial<LearningObjectStats>>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.fetchStats = function (params) {
        return this.statStore.fetchStats({ query: params.query });
    };
    /**
     * Get LearningObject IDs owned by User
     *
     * @param {string} username
     * @returns {string[]}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.getUserObjects = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var id, user, e_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findUser(username)];
                    case 1:
                        id = _a.sent();
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.User.name)
                                .findOne({ _id: id })];
                    case 2:
                        user = _a.sent();
                        return [2 /*return*/, user.objects];
                    case 3:
                        e_15 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetch User's Objects. Error: " + e_15)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Look up a user by its login id.
     * @async
     *
     * @param {string} id the user's login id
     *
     * @returns {UserID}
     */
    MongoDriver.prototype.findUser = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var query, userRecord, e_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = {};
                        if (isEmail(username)) {
                            query['email'] = username;
                        }
                        else {
                            query['username'] = username;
                        }
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.User.name)
                                .findOne(query)];
                    case 1:
                        userRecord = _a.sent();
                        if (!userRecord)
                            return [2 /*return*/, Promise.reject('No user with username or email' + username + ' exists.')];
                        return [2 /*return*/, "" + userRecord._id];
                    case 2:
                        e_16 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_16)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Look up a learning object by its author and name.
     * @async
     *
     * @param {UserID} author the author's unique database id
     * @param {string} name the object's name
     *
     * @returns {LearningObjectID}
     */
    MongoDriver.prototype.findLearningObject = function (username, name) {
        return __awaiter(this, void 0, void 0, function () {
            var authorID, doc, e_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findUser(username)];
                    case 1:
                        authorID = _a.sent();
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .findOne({
                                authorID: authorID,
                                name: name
                            })];
                    case 2:
                        doc = _a.sent();
                        if (!doc)
                            return [2 /*return*/, Promise.reject('No learning object ' + name + ' for the given user')];
                        return [2 /*return*/, Promise.resolve(doc._id)];
                    case 3:
                        e_17 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_17)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Look up a learning outcome by its source and tag.
     * @async
     *
     * @param {LearningObjectID} source the object source's unique database id
     * @param {number} tag the outcome's unique identifier
     *
     * @returns {LearningOutcomeID}
     */
    MongoDriver.prototype.findLearningOutcome = function (source, tag) {
        return __awaiter(this, void 0, void 0, function () {
            var doc, e_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningOutcome.name)
                                .findOne({
                                source: source,
                                tag: tag
                            })];
                    case 1:
                        doc = _a.sent();
                        if (!doc)
                            return [2 /*return*/, Promise.reject('No learning outcome ' + tag + ' for the given learning object')];
                        return [2 /*return*/, Promise.resolve(doc._id)];
                    case 2:
                        e_18 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_18)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Look up a standard outcome by its tag.
     * @async
     *
     * @param {string} tag the outcome's unique identifier
     *
     * @returns {StandardOutcomeID}
     */
    MongoDriver.prototype.findMappingID = function (date, name, outcome) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, doc, e_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        tag = date + '$' + name + '$' + outcome;
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.StandardOutcome.name)
                                .findOne({
                                tag: tag
                            })];
                    case 1:
                        doc = _a.sent();
                        if (!doc)
                            return [2 /*return*/, Promise.reject('No mappings found with tag: ' + tag + ' in the database')];
                        return [2 /*return*/, Promise.resolve(doc._id)];
                    case 2:
                        e_19 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_19)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch the user document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {UserRecord}
     */
    MongoDriver.prototype.fetchUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var doc, user, e_20;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetch(COLLECTIONS.User, id)];
                    case 1:
                        doc = _a.sent();
                        user = ObjectMapper.generateUser(doc);
                        return [2 /*return*/, user];
                    case 2:
                        e_20 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_20)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch the learning object document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningObjectRecord}
     */
    MongoDriver.prototype.fetchLearningObject = function (id, full, accessUnpublished) {
        return __awaiter(this, void 0, void 0, function () {
            var object, author, learningObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetch(COLLECTIONS.LearningObject, id)];
                    case 1:
                        object = _a.sent();
                        return [4 /*yield*/, this.fetchUser(object.authorID)];
                    case 2:
                        author = _a.sent();
                        return [4 /*yield*/, this.generateLearningObject(author, object, full)];
                    case 3:
                        learningObject = _a.sent();
                        if (!accessUnpublished && !learningObject.published)
                            return [2 /*return*/, Promise.reject('User does not have access to the requested resource.')];
                        return [2 /*return*/, learningObject];
                }
            });
        });
    };
    /**
     * Fetch the learning outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningOutcomeRecord}
     */
    MongoDriver.prototype.fetchLearningOutcome = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var record, outcome, e_21;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.fetch(COLLECTIONS.LearningOutcome, id)];
                    case 1:
                        record = _a.sent();
                        return [4 /*yield*/, this.generateLearningOutcome(record)];
                    case 2:
                        outcome = _a.sent();
                        return [2 /*return*/, outcome];
                    case 3:
                        e_21 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_21)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch the generic outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {OutcomeRecord}
     */
    MongoDriver.prototype.fetchOutcome = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var record, outcome, e_22;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.fetch(COLLECTIONS.StandardOutcome, id)];
                    case 1:
                        record = _a.sent();
                        return [4 /*yield*/, this.generateStandardOutcome(record)];
                    case 2:
                        outcome = _a.sent();
                        return [2 /*return*/, outcome];
                    case 3:
                        e_22 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_22)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Return literally all objects. Very expensive.
     * @returns {Cursor<LearningObjectRecord>[]} cursor of literally all objects
     */
    MongoDriver.prototype.fetchAllObjects = function (accessUnpublished, page, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var query, objectCursor, totalRecords, docs, learningObjects, e_23;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        query = {};
                        if (!accessUnpublished) {
                            query.published = true;
                        }
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .find(query)];
                    case 1:
                        objectCursor = _a.sent();
                        return [4 /*yield*/, objectCursor.count()];
                    case 2:
                        totalRecords = _a.sent();
                        objectCursor = this.applyCursorFilters(objectCursor, { page: page, limit: limit });
                        return [4 /*yield*/, objectCursor.toArray()];
                    case 3:
                        docs = _a.sent();
                        return [4 /*yield*/, this.bulkGenerateLearningObjects(docs)];
                    case 4:
                        learningObjects = _a.sent();
                        return [2 /*return*/, Promise.resolve({
                                objects: learningObjects,
                                total: totalRecords
                            })];
                    case 5:
                        e_23 = _a.sent();
                        return [2 /*return*/, Promise.reject("Error fetching all learning objects. Error: " + e_23)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Converts array of LearningObjectDocuments to Learning Objects
     *
     * @private
     * @param {LearningObjectDocument[]} docs
     * @returns {Promise<LearningObject[]>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.bulkGenerateLearningObjects = function (docs, full) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(docs.map(function (doc) { return __awaiter(_this, void 0, void 0, function () {
                            var author, learningObject;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.fetchUser(doc.authorID)];
                                    case 1:
                                        author = _a.sent();
                                        return [4 /*yield*/, this.generateLearningObject(author, doc, full)];
                                    case 2:
                                        learningObject = _a.sent();
                                        learningObject.id = doc._id;
                                        return [2 /*return*/, learningObject];
                                }
                            });
                        }); }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Fetches the learning object documents associated with the given ids.
     *
     * @param ids array of database ids
     *
     * @returns {Cursor<LearningObjectRecord>[]}
     */
    MongoDriver.prototype.fetchMultipleObjects = function (ids, full, accessUnpublished, orderBy, sortType) {
        return __awaiter(this, void 0, void 0, function () {
            var query, objectCursor, docs, learningObjects, e_24;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        query = { _id: { $in: ids } };
                        if (!accessUnpublished)
                            query.published = true;
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .find(query)];
                    case 1:
                        objectCursor = _a.sent();
                        objectCursor = this.applyCursorFilters(objectCursor, {
                            orderBy: orderBy,
                            sortType: sortType
                        });
                        return [4 /*yield*/, objectCursor.toArray()];
                    case 2:
                        docs = _a.sent();
                        return [4 /*yield*/, this.bulkGenerateLearningObjects(docs, full)];
                    case 3:
                        learningObjects = _a.sent();
                        return [2 /*return*/, learningObjects];
                    case 4:
                        e_24 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching LearningObjects: " + ids + ". Error: " + e_24)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /* Search for objects on CuBE criteria.
     *
     * TODO: Efficiency very questionable.
     *      Convert to streaming algorithm if possible.
     *
     * TODO: behavior is currently very strict (ex. name, author must exactly match)
     *       Consider text-indexing these fields to exploit mongo $text querying.
     */
    // tslint:disable-next-line:member-ordering
    MongoDriver.prototype.searchObjects = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var authorRecords, exactAuthor, outcomeIDs, outcomeRecords, query, objectCursor, totalRecords, docs, learningObjects, e_25;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, this.matchUsers(params.author, params.text)];
                    case 1:
                        authorRecords = _a.sent();
                        exactAuthor = params.author && authorRecords && authorRecords.length ? true : false;
                        outcomeIDs = void 0;
                        if (!params.standardOutcomeIDs) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.matchOutcomes(params.standardOutcomeIDs)];
                    case 2:
                        outcomeRecords = _a.sent();
                        outcomeIDs = outcomeRecords ? outcomeRecords.map(function (doc) { return doc._id; }) : null;
                        _a.label = 3;
                    case 3:
                        query = this.buildSearchQuery(params.accessUnpublished, params.text, authorRecords, params.status, params.length, params.level, outcomeIDs, params.name, params.collection, exactAuthor, params.released);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .find(query)
                                .project({ score: { $meta: 'textScore' } })
                                .sort({ score: { $meta: 'textScore' } })];
                    case 4:
                        objectCursor = _a.sent();
                        return [4 /*yield*/, objectCursor.count()];
                    case 5:
                        totalRecords = _a.sent();
                        if (typeof params.sortType === 'string') {
                            // @ts-ignore
                            sortType = parseInt(sortType, 10) || 1;
                        }
                        // Paginate if has limiter
                        objectCursor = this.applyCursorFilters(objectCursor, {
                            page: params.page,
                            limit: params.limit,
                            orderBy: params.orderBy,
                            sortType: params.sortType
                        });
                        return [4 /*yield*/, objectCursor.toArray()];
                    case 6:
                        docs = _a.sent();
                        return [4 /*yield*/, this.bulkGenerateLearningObjects(docs, false)];
                    case 7:
                        learningObjects = _a.sent();
                        return [2 /*return*/, Promise.resolve({
                                objects: learningObjects,
                                total: totalRecords
                            })];
                    case 8:
                        e_25 = _a.sent();
                        return [2 /*return*/, Promise.reject('Error suggesting objects' + e_25)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.findSingleFile = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var doc, materials, e_26;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .findOne({
                                _id: params.learningObjectId,
                                'materials.files': {
                                    $elemMatch: { id: params.fileId }
                                }
                            }, {
                                projection: {
                                    _id: 0,
                                    'materials.files.$': 1
                                }
                            })];
                    case 1:
                        doc = _a.sent();
                        if (doc) {
                            materials = doc.materials;
                            // Object contains materials property.
                            // Files array within materials will alway contain one element
                            return [2 /*return*/, materials.files[0]];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_26 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_26)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Builds query object for Learning Object search
     *
     * @private
     * @param {boolean} accessUnpublished
     * @param {string} text
     * @param {string[]} authorIDs
     * @param {string[]} length
     * @param {string[]} level
     * @param {string[]} outcomeIDs
     * @param {string} name
     * @returns
     * @memberof MongoDriver
     */
    MongoDriver.prototype.buildSearchQuery = function (accessUnpublished, text, authors, status, length, level, outcomeIDs, name, collection, exactAuthor, released) {
        var query = {};
        if (!accessUnpublished) {
            query.published = true;
        }
        if (released) {
            // Check that the learning object does not have a download restriction
            query['lock.restrictions'] = { $nin: [learning_object_1.Restriction.DOWNLOAD] };
        }
        // Search By Text
        if (text || text === '') {
            query = this.buildTextSearchQuery(query, text, authors, exactAuthor, status, length, level, outcomeIDs, collection);
        }
        else {
            // Search by fields
            query = this.buildFieldSearchQuery(name, query, authors, status, length, level, outcomeIDs, collection, exactAuthor);
        }
        return query;
    };
    /**
     * Builds Learning Object Query based on Fields
     *
     * @private
     * @param {string} name
     * @param {*} query
     * @param {{ _id: string; username: string }[]} authors
     * @param {string[]} length
     * @param {string[]} level
     * @param {string[]} outcomeIDs
     * @returns
     * @memberof MongoDriver
     */
    MongoDriver.prototype.buildFieldSearchQuery = function (name, query, authors, status, length, level, outcomeIDs, collection, exactAuthor) {
        if (name) {
            query.$text = { $search: name };
        }
        if (authors) {
            if (exactAuthor) {
                query.authorID = authors[0]._id;
            }
            else {
                query.$or.push({
                    authorID: { $in: authors.map(function (author) { return author._id; }) }
                }, {
                    contributors: { $in: authors.map(function (author) { return author.username; }) }
                });
            }
        }
        if (length) {
            query.length = { $in: length };
        }
        if (level) {
            query.levels = { $in: level };
        }
        if (status) {
            query.status = { $in: status };
        }
        if (outcomeIDs) {
            query.outcomes = { $in: outcomeIDs };
        }
        if (collection) {
            query.collection = collection;
        }
        return query;
    };
    /**
     * Builds Learning Object Query based on Text
     *
     * @private
     * @param {*} query
     * @param {string} text
     * @param {{ _id: string; username: string }[]} authors
     * @param {boolean} exactAuthor
     * @param {string[]} length
     * @param {string[]} level
     * @param {string[]} outcomeIDs
     * @returns
     * @memberof MongoDriver
     */
    MongoDriver.prototype.buildTextSearchQuery = function (query, text, authors, exactAuthor, status, length, level, outcomeIDs, collection) {
        var regex = new RegExp(sanitizeRegex(text));
        query.$or = [
            { $text: { $search: text } },
            { name: { $regex: regex } },
            { contributors: { $regex: regex } },
        ];
        if (authors && authors.length) {
            if (exactAuthor) {
                query.authorID = authors[0]._id;
            }
            else {
                query.$or.push({
                    authorID: { $in: authors.map(function (author) { return author._id; }) }
                }, {
                    contributors: { $in: authors.map(function (author) { return author._id; }) }
                });
            }
        }
        if (length) {
            query.length = { $in: length };
        }
        if (level) {
            query.levels = { $in: level };
        }
        if (status) {
            query.status = { $in: status };
        }
        if (collection) {
            query.collection = collection;
        }
        if (outcomeIDs) {
            query.outcomes = outcomeIDs.length
                ? { $in: outcomeIDs }
                : ['DONT MATCH ME'];
        }
        return query;
    };
    MongoDriver.prototype.applyCursorFilters = function (cursor, filters) {
        try {
            if (filters.page !== undefined && filters.page <= 0) {
                filters.page = 1;
            }
            var skip = filters.page && filters.limit
                ? (filters.page - 1) * filters.limit
                : undefined;
            // Paginate if has limiter
            cursor =
                skip !== undefined
                    ? cursor.skip(skip).limit(filters.limit)
                    : filters.limit
                        ? cursor.limit(filters.limit)
                        : cursor;
            // SortBy
            cursor = filters.orderBy
                ? cursor.sort(filters.orderBy, filters.sortType ? filters.sortType : 1)
                : cursor;
            return cursor;
        }
        catch (e) {
            console.log(e);
        }
    };
    /**
     * Gets Learning Outcome IDs that contain Standard Outcome IDs
     *
     * @private
     * @param {string[]} standardOutcomeIDs
     * @returns {Promise<LearningOutcomeDocument[]>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.matchOutcomes = function (standardOutcomeIDs) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!standardOutcomeIDs) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningOutcome.name)
                                .find({
                                mappings: { $all: standardOutcomeIDs }
                            })
                                .toArray()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = null;
                        _b.label = 3;
                    case 3: return [2 /*return*/, _a];
                }
            });
        });
    };
    /**
     * Search for users that match author or text param
     *
     * @private
     * @param {string} author
     * @param {string} text
     * @returns {Promise<UserDocument[]>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.matchUsers = function (author, text) {
        return __awaiter(this, void 0, void 0, function () {
            var query, regex, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = {
                            $or: [{ $text: { $search: author ? author : text } }]
                        };
                        if (text) {
                            regex = new RegExp(sanitizeRegex(text), 'ig');
                            query.$or.push({ username: { $regex: regex } }, { name: { $regex: regex } }, { email: { $regex: regex } });
                        }
                        if (!(author || text)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.User.name)
                                .find(query)
                                .project({
                                _id: 1,
                                username: 1,
                                score: { $meta: 'textScore' }
                            })
                                .sort({ score: { $meta: 'textScore' } })
                                .toArray()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = Promise.resolve(null);
                        _b.label = 3;
                    case 3: return [2 /*return*/, _a];
                }
            });
        });
    };
    /**
     * Fetches all Learning Object collections
     *
     * @returns {Promise<LearningObjectCollection[]>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.fetchCollections = function () {
        return __awaiter(this, void 0, void 0, function () {
            var collections, e_27;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObjectCollection.name)
                                .aggregate([
                                {
                                    $project: {
                                        _id: 0,
                                        name: 1,
                                        abvName: 1,
                                        hasLogo: 1
                                    }
                                },
                            ])
                                .toArray()];
                    case 1:
                        collections = _a.sent();
                        return [2 /*return*/, collections];
                    case 2:
                        e_27 = _a.sent();
                        console.error(e_27);
                        return [2 /*return*/, Promise.reject(e_27)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches Learning Object Collection by name
     *
     * @param {string} name
     * @returns {Promise<LearningObjectCollection>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.fetchCollection = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, objects, e_28;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObjectCollection.name)
                                .findOne({ name: name })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, Promise.all(collection.learningObjects.map(function (id) {
                                return _this.fetchLearningObject(id, false, false);
                            }))];
                    case 2:
                        objects = _a.sent();
                        collection.learningObjects = objects;
                        return [2 /*return*/, collection];
                    case 3:
                        e_28 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_28)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.fetchCollectionMeta = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var meta, e_29;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObjectCollection.name)
                                .findOne({ name: name }, { name: 1, abstracts: 1 })];
                    case 1:
                        meta = _a.sent();
                        return [2 /*return*/, meta];
                    case 2:
                        e_29 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_29)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.fetchCollectionObjects = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, objects, e_30;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObjectCollection.name)
                                .findOne({ name: name }, { learningObjects: 1 })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, Promise.all(collection.learningObjects.map(function (id) {
                                return _this.fetchLearningObject(id, false, false);
                            }))];
                    case 2:
                        objects = _a.sent();
                        collection.learningObjects = objects;
                        return [2 /*return*/, collection];
                    case 3:
                        e_30 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_30)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MongoDriver.prototype.addToCollection = function (learningObjectId, collection) {
        return __awaiter(this, void 0, void 0, function () {
            var e_31;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // access learning object and update it's collection property
                        return [4 /*yield*/, this.db
                                .collection(COLLECTIONS.LearningObject.name)
                                .findOneAndUpdate({ _id: learningObjectId }, { $set: { collection: collection } })];
                    case 1:
                        // access learning object and update it's collection property
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_31 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_31)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ////////////////////////////////////////////////
    // GENERIC HELPER METHODS - not in public API //
    ////////////////////////////////////////////////
    /**
     * Converts Learning Object to Document
     *
     * @private
     * @param {LearningObject} object
     * @param {boolean} [isNew]
     * @param {string} [id]
     * @returns {Promise<LearningObjectDocument>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.documentLearningObject = function (object, isNew, id) {
        return __awaiter(this, void 0, void 0, function () {
            var authorID, contributorIds, doc, e_32;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.findUser(object.author.username)];
                    case 1:
                        authorID = _a.sent();
                        contributorIds = [];
                        if (!(object.contributors && object.contributors.length)) return [3 /*break*/, 3];
                        return [4 /*yield*/, Promise.all(object.contributors.map(function (user) { return _this.findUser(user.username); }))];
                    case 2:
                        contributorIds = _a.sent();
                        _a.label = 3;
                    case 3:
                        doc = {
                            authorID: authorID,
                            name: object.name,
                            date: object.date,
                            length: object.length,
                            levels: object.levels,
                            goals: object.goals.map(function (goal) {
                                return {
                                    text: goal.text
                                };
                            }),
                            outcomes: [],
                            materials: object.materials,
                            published: object.published,
                            contributors: contributorIds,
                            collection: object.collection,
                            lock: object.lock
                        };
                        if (isNew) {
                            doc._id = new mongodb_1.ObjectID().toHexString();
                        }
                        else {
                            doc._id = id;
                            delete doc.outcomes;
                        }
                        return [2 /*return*/, doc];
                    case 4:
                        e_32 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem creating document for Learning Object. Error:" + e_32)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Converts Learning Outcome to Document
     *
     * @private
     * @param {LearningOutcome} outcome
     * @param {{
     *       learningObjectID: string;
     *       learningObjectName: string;
     *       authorName: string;
     *     }} source
     * @param {boolean} [isNew]
     * @returns {Promise<LearningOutcomeDocument>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.documentLearningOutcome = function (outcome, source, isNew) {
        try {
            var doc = {
                source: source.learningObjectID,
                tag: outcome.tag,
                author: source.authorName,
                name: source.learningObjectName,
                date: outcome.date,
                outcome: outcome.outcome,
                bloom: outcome.bloom,
                verb: outcome.verb,
                text: outcome.text,
                assessments: outcome.assessments.map(function (assessment) {
                    return {
                        plan: assessment.plan,
                        text: assessment.text
                    };
                }),
                strategies: outcome.strategies.map(function (strategy) {
                    return { plan: strategy.plan, text: strategy.text };
                }),
                mappings: outcome.mappings.map(function (mapping) { return mapping.id; })
            };
            if (isNew) {
                doc._id = new mongodb_1.ObjectID().toHexString();
            }
            return doc;
        }
        catch (e) {
            throw new Error("Problem creating document for Learning Outcome. Error:" + e);
        }
    };
    /**
     * Generates Learning Object from Document
     *
     * @private
     * @param {User} author
     * @param {LearningObjectDocument} record
     * @param {boolean} [full]
     * @returns {Promise<LearningObject>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.generateLearningObject = function (author, record, full) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObject, _i, _a, goal, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        learningObject = new clark_entity_1.LearningObject(author, record.name);
                        learningObject.id = record._id;
                        learningObject.date = record.date;
                        learningObject.length = record.length;
                        learningObject.levels = record.levels;
                        learningObject.materials = record.materials;
                        record.published ? learningObject.publish() : learningObject.unpublish();
                        learningObject.children = record.children;
                        learningObject.lock = record.lock;
                        learningObject.collection = record.collection;
                        learningObject.status = record.status;
                        for (_i = 0, _a = record.goals; _i < _a.length; _i++) {
                            goal = _a[_i];
                            learningObject.addGoal(goal.text);
                        }
                        if (!full) {
                            return [2 /*return*/, learningObject];
                        }
                        if (!(record.contributors && record.contributors.length)) return [3 /*break*/, 2];
                        _b = learningObject;
                        return [4 /*yield*/, Promise.all(record.contributors.map(function (user) { return __awaiter(_this, void 0, void 0, function () {
                                var id, obj;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(typeof user === 'string')) return [3 /*break*/, 1];
                                            id = user;
                                            return [3 /*break*/, 3];
                                        case 1:
                                            obj = clark_entity_1.User.instantiate(user);
                                            return [4 /*yield*/, this.findUser(obj.username)];
                                        case 2:
                                            id = _a.sent();
                                            SentryConnector_1.reportError(new Error("Learning object " + record._id + " contains an invalid type for contributors property."));
                                            _a.label = 3;
                                        case 3: return [2 /*return*/, this.fetchUser(id)];
                                    }
                                });
                            }); }))];
                    case 1:
                        _b.contributors = _c.sent();
                        _c.label = 2;
                    case 2: 
                    // load each outcome
                    return [4 /*yield*/, Promise.all(record.outcomes.map(function (outcomeID) { return __awaiter(_this, void 0, void 0, function () {
                            var rOutcome, outcome, _i, _a, rAssessment, assessment, _b, _c, rStrategy, strategy, _d, _e, mapping;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0: return [4 /*yield*/, this.fetchLearningOutcome(outcomeID)];
                                    case 1:
                                        rOutcome = _f.sent();
                                        outcome = learningObject.addOutcome();
                                        outcome.bloom = rOutcome.bloom;
                                        outcome.verb = rOutcome.verb;
                                        outcome.text = rOutcome.text;
                                        for (_i = 0, _a = rOutcome.assessments; _i < _a.length; _i++) {
                                            rAssessment = _a[_i];
                                            assessment = outcome.addAssessment();
                                            assessment.plan = rAssessment.plan;
                                            assessment.text = rAssessment.text;
                                        }
                                        for (_b = 0, _c = rOutcome.strategies; _b < _c.length; _b++) {
                                            rStrategy = _c[_b];
                                            strategy = outcome.addStrategy();
                                            strategy.plan = rStrategy.plan;
                                            strategy.text = rStrategy.text;
                                        }
                                        // only extract the basic info for each mapped outcome
                                        for (_d = 0, _e = rOutcome.mappings; _d < _e.length; _d++) {
                                            mapping = _e[_d];
                                            outcome.mapTo(mapping);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 3:
                        // load each outcome
                        _c.sent();
                        return [2 /*return*/, learningObject];
                }
            });
        });
    };
    /**
     * Generates LearningOutcome from Document
     *
     * @private
     * @param {LearningOutcomeDocument} record
     * @returns {Promise<LearningOutcome>}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.generateLearningOutcome = function (record) {
        return __awaiter(this, void 0, void 0, function () {
            var outcome, _i, _a, rAssessment, assessment, _b, _c, rStrategy, strategy, _d, _e, mappingID, mapping, e_33;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 5, , 6]);
                        outcome = new clark_entity_1.LearningOutcome(new clark_entity_1.LearningObject());
                        outcome.bloom = record.bloom;
                        outcome.verb = record.verb;
                        outcome.text = record.text;
                        // Add assessments
                        for (_i = 0, _a = record.assessments; _i < _a.length; _i++) {
                            rAssessment = _a[_i];
                            assessment = outcome.addAssessment();
                            assessment.plan = rAssessment.plan;
                            assessment.text = rAssessment.text;
                        }
                        // Add Strategies
                        for (_b = 0, _c = record.strategies; _b < _c.length; _b++) {
                            rStrategy = _c[_b];
                            strategy = outcome.addStrategy();
                            strategy.plan = rStrategy.plan;
                            strategy.text = rStrategy.text;
                        }
                        _d = 0, _e = record.mappings;
                        _f.label = 1;
                    case 1:
                        if (!(_d < _e.length)) return [3 /*break*/, 4];
                        mappingID = _e[_d];
                        return [4 /*yield*/, this.fetchOutcome(mappingID)];
                    case 2:
                        mapping = _f.sent();
                        outcome.mapTo(mapping);
                        _f.label = 3;
                    case 3:
                        _d++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, outcome];
                    case 5:
                        e_33 = _f.sent();
                        return [2 /*return*/, Promise.reject("Problem generating LearningOutcome. Error: " + e_33)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates Outcome from Document
     *
     * @private
     * @param {StandardOutcomeDocument} record
     * @returns {Outcome}
     * @memberof MongoDriver
     */
    MongoDriver.prototype.generateStandardOutcome = function (record) {
        var outcome = {
            id: record._id,
            author: record.author,
            name: record.name,
            date: record.date,
            outcome: record.outcome
        };
        return outcome;
    };
    /**
     * Reject promise if any foreign keys in a record do not exist.
     * @async
     *
     * @param {Function} schema provides information for each foreign key
     * @param {Record} record which record to validate
     * @param {Set<string>} foreigns which fields to check
     *
     * @returns none, but promise will be rejected if there is a problem
     */
    MongoDriver.prototype.validateForeignKeys = function (record, foreigns) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, foreigns_1, foreign, data, keys, _a, keys_1, key, collection, count, e_34;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        if (!foreigns) return [3 /*break*/, 6];
                        _i = 0, foreigns_1 = foreigns;
                        _b.label = 1;
                    case 1:
                        if (!(_i < foreigns_1.length)) return [3 /*break*/, 6];
                        foreign = foreigns_1[_i];
                        data = foreign.data;
                        keys = record[foreign.name];
                        if (!(keys instanceof Array))
                            keys = [keys];
                        _a = 0, keys_1 = keys;
                        _b.label = 2;
                    case 2:
                        if (!(_a < keys_1.length)) return [3 /*break*/, 5];
                        key = keys_1[_a];
                        collection = COLLECTIONS_MAP.get(data.target);
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .count({ _id: key })];
                    case 3:
                        count = _b.sent();
                        if (count === 0) {
                            return [2 /*return*/, Promise.reject('Foreign key error for ' +
                                    record +
                                    ': ' +
                                    key +
                                    ' not in ' +
                                    data.target +
                                    ' collection')];
                        }
                        _b.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, Promise.resolve()];
                    case 7:
                        e_34 = _b.sent();
                        return [2 /*return*/, Promise.reject('Problem validating key constraint :\n\t' + e_34)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add an item's id to a foreign registry.
     * @async
     *
     * @param {string} collection where to find the foreign registry owner
     * @param {RecordID} owner the foreign registry owner
     * @param {string} registry field name of the registry
     * @param {RecordID} item which item to add
     */
    MongoDriver.prototype.register = function (collection, owner, registry, item) {
        return __awaiter(this, void 0, void 0, function () {
            var record, pushdoc, e_35;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .findOne({ _id: owner })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Registration failed: no owner ' +
                                    owner +
                                    'found in ' +
                                    collection.name)];
                        pushdoc = {};
                        pushdoc[registry] = item;
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .updateOne({ _id: owner }, { $push: pushdoc })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 3:
                        e_35 = _a.sent();
                        return [2 /*return*/, Promise.reject('Problem registering to a ' +
                                collection.name +
                                ' ' +
                                registry +
                                ' field:\n\t' +
                                e_35)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove an item's id from a foreign registry.
     * @async
     *
     * @param {string} collection where to find the foreign registry owner
     * @param {RecordID} owner the foreign registry owner
     * @param {string} registry field name of the registry
     * @param {RecordID} item which item to remove
     */
    MongoDriver.prototype.unregister = function (collection, owner, registry, item) {
        return __awaiter(this, void 0, void 0, function () {
            var record, pulldoc, e_36;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .findOne({ _id: owner })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Un-registration failed: no record ' +
                                    owner +
                                    'found in ' +
                                    collection)];
                        if (!record[registry].includes(item)) {
                            return [2 /*return*/, Promise.reject('Un-registration failed: record ' +
                                    owner +
                                    ' s' +
                                    registry +
                                    ' field has no element ' +
                                    item)];
                        }
                        pulldoc = {};
                        pulldoc[registry] = item;
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .updateOne({ _id: owner }, { $pull: pulldoc })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 3:
                        e_36 = _a.sent();
                        return [2 /*return*/, Promise.reject('Problem un-registering from a ' +
                                collection.name +
                                ' ' +
                                registry +
                                ' field:\n\t' +
                                e_36)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reorder an item in a registry.
     * @async
     *
     * @param {string} collection where to find the registry owner
     * @param {RecordID} owner the registry owner
     * @param {string} registry field name of the registry
     * @param {RecordID} item which item to move
     * @param {number} index the new index for item
     */
    MongoDriver.prototype.reorder = function (collection, owner, registry, item, index) {
        return __awaiter(this, void 0, void 0, function () {
            var record, pushdoc, e_37;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .findOne({ _id: owner })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Reorder failed: no record ' + owner + 'found in ' + collection.name)];
                        if (!record[registry].includes(item)) {
                            return [2 /*return*/, Promise.reject('Reorder failed: record ' +
                                    owner +
                                    ' s' +
                                    registry +
                                    ' field has no element ' +
                                    item)];
                        }
                        if (index < 0)
                            return [2 /*return*/, Promise.reject('Reorder failed: index cannot be negative')];
                        if (index >= record[registry].length) {
                            return [2 /*return*/, Promise.reject('Reorder failed: index exceeds length of ' + registry + ' field')];
                        }
                        // perform the necessary operations
                        return [4 /*yield*/, this.unregister(collection, owner, registry, item)];
                    case 2:
                        // perform the necessary operations
                        _a.sent();
                        pushdoc = {};
                        pushdoc[registry] = { $each: [item], $position: index };
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .updateOne({ _id: owner }, { $push: pushdoc })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 4:
                        e_37 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_37)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Insert a generic item to the database.
     * @async
     *
     * @param {Function} schema provides collection/validation information
     * @param {Insert} record document to insert
     *
     * @returns {RecordID} the database id of the new record
     */
    MongoDriver.prototype.insert = function (collection, record) {
        return __awaiter(this, void 0, void 0, function () {
            var foreigns, insert_, id, _i, foreigns_2, foreign, data, collection_1, e_38;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        foreigns = collection.foreigns;
                        if (!foreigns) return [3 /*break*/, 2];
                        // check validity of all foreign keys
                        return [4 /*yield*/, this.validateForeignKeys(record, foreigns)];
                    case 1:
                        // check validity of all foreign keys
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.db
                            .collection(collection.name)
                            .insertOne(record)];
                    case 3:
                        insert_ = _a.sent();
                        id = insert_.insertedId;
                        if (!foreigns) return [3 /*break*/, 7];
                        _i = 0, foreigns_2 = foreigns;
                        _a.label = 4;
                    case 4:
                        if (!(_i < foreigns_2.length)) return [3 /*break*/, 7];
                        foreign = foreigns_2[_i];
                        data = foreign.data;
                        if (!(!data.child && data.registry)) return [3 /*break*/, 6];
                        collection_1 = COLLECTIONS_MAP.get(data.target);
                        return [4 /*yield*/, this.register(collection_1, record[foreign.name], data.registry, "" + id)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/, Promise.resolve("" + id)];
                    case 8:
                        e_38 = _a.sent();
                        return [2 /*return*/, Promise.reject('Problem inserting a ' + collection.name + ':\n\t' + e_38)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Edit (update without foreigns) a generic item in the database.
     * @async
     *
     * @param {Function} schema provides collection/validation information
     * @param {RecordID} id which document to edit
     * @param {Edit} record the values to change to
     */
    MongoDriver.prototype.edit = function (collection, id, record) {
        return __awaiter(this, void 0, void 0, function () {
            var e_39;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // no foreign fields, no need to validate
                        // perform the actual update
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .updateOne({ _id: id }, { $set: record })];
                    case 1:
                        // no foreign fields, no need to validate
                        // perform the actual update
                        _a.sent();
                        // registered fields must be fixed, nothing to change here
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_39 = _a.sent();
                        console.log(e_39);
                        return [2 /*return*/, Promise.reject('Problem editing a ' + collection.name + ':\n\t' + e_39)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cascade delete a record and its children.
     * @async
     *
     * @param {COLLECTIONS} collection provides collection information
     * @param {string} id the document to delete
     */
    MongoDriver.prototype.remove = function (collection, id) {
        return __awaiter(this, void 0, void 0, function () {
            var record, foreigns, _i, foreigns_3, foreign, data, keys, _a, keys_2, key, collection_2, keys, _b, keys_3, key, collection_3, e_40;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 13, , 14]);
                        return [4 /*yield*/, this.db
                                .collection(collection.name)
                                .findOne({ _id: id })];
                    case 1:
                        record = _c.sent();
                        foreigns = collection.foreigns;
                        if (!foreigns) return [3 /*break*/, 11];
                        _i = 0, foreigns_3 = foreigns;
                        _c.label = 2;
                    case 2:
                        if (!(_i < foreigns_3.length)) return [3 /*break*/, 11];
                        foreign = foreigns_3[_i];
                        data = foreign.data;
                        if (!data.child) return [3 /*break*/, 6];
                        keys = record[foreign.name];
                        if (!(keys instanceof Array))
                            keys = [keys];
                        _a = 0, keys_2 = keys;
                        _c.label = 3;
                    case 3:
                        if (!(_a < keys_2.length)) return [3 /*break*/, 6];
                        key = keys_2[_a];
                        collection_2 = COLLECTIONS_MAP.get(data.target);
                        return [4 /*yield*/, this.remove(collection_2, key)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _a++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!(!data.child && data.registry)) return [3 /*break*/, 10];
                        keys = record[foreign.name];
                        if (!(keys instanceof Array))
                            keys = [keys];
                        _b = 0, keys_3 = keys;
                        _c.label = 7;
                    case 7:
                        if (!(_b < keys_3.length)) return [3 /*break*/, 10];
                        key = keys_3[_b];
                        collection_3 = COLLECTIONS_MAP.get(data.target);
                        return [4 /*yield*/, this.unregister(collection_3, key, data.registry, id)];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9:
                        _b++;
                        return [3 /*break*/, 7];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11: 
                    // perform actual deletion
                    return [4 /*yield*/, this.db.collection(collection.name).deleteOne({ _id: id })];
                    case 12:
                        // perform actual deletion
                        _c.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 13:
                        e_40 = _c.sent();
                        return [2 /*return*/, Promise.reject('Problem deleting ' + collection + ':\n\t' + e_40)];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch a database record by its id.
     * @param {Function} schema provides collection information
     * @param {string} id the document to fetch
     */
    MongoDriver.prototype.fetch = function (collection, id) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db
                            .collection(collection.name)
                            .findOne({ _id: id })];
                    case 1:
                        record = _a.sent();
                        if (!record)
                            return [2 /*return*/, Promise.reject('Problem fetching a ' +
                                    collection.name +
                                    ':\n\tInvalid database id ' +
                                    JSON.stringify(id))];
                        return [2 /*return*/, Promise.resolve(record)];
                }
            });
        });
    };
    return MongoDriver;
}());
exports.MongoDriver = MongoDriver;
function isEmail(value) {
    var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailPattern.test(value)) {
        return true;
    }
    return false;
}
exports.isEmail = isEmail;
/**
 * Escapes Regex quantifier, alternation, single sequence anchor, new line, and parenthesis characters in a string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
function sanitizeRegex(text) {
    var regexChars = /\.|\+|\*|\^|\$|\?|\[|\]|\(|\)|\|/;
    if (regexChars.test(text)) {
        var newString = '';
        var chars = text.split('');
        for (var _i = 0, chars_1 = chars; _i < chars_1.length; _i++) {
            var c = chars_1[_i];
            var isSpecial = regexChars.test(c.trim());
            if (isSpecial) {
                newString += "\\" + c;
            }
            else {
                newString += c;
            }
        }
        text = newString;
    }
    return text;
}
exports.sanitizeRegex = sanitizeRegex;
