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
var stopword = require("stopword");
// file size is in bytes
var MAX_PACKAGEABLE_FILE_SIZE = 100000000;
var LearningObjectInteractor = /** @class */ (function () {
    function LearningObjectInteractor() {
    }
    /**
     * Load the scalar fields of a user's objects (ignore goals and outcomes).
     * @async
     *
     * @param {string} userid the user's login id
     *
     * @returns {User}
     */
    LearningObjectInteractor.loadLearningObjectSummary = function (dataStore, library, username, accessUnpublished, loadChildren, query) {
        return __awaiter(this, void 0, void 0, function () {
            var total, summary, level, length_1, status_1, response, objectIDs, e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        total = 0;
                        summary = [];
                        if (!(query &&
                            (query.name ||
                                query.length ||
                                query.level ||
                                query.standardOutcomeIDs ||
                                query.orderBy ||
                                query.sortType ||
                                query.collection ||
                                query.status ||
                                query.text))) return [3 /*break*/, 2];
                        level = query.level ? (Array.isArray(query.level) ? query.level : [query.level]) : undefined;
                        length_1 = query.length ? (Array.isArray(query.length) ? query.length : [query.length]) : undefined;
                        status_1 = query.status ? (Array.isArray(query.status) ? query.status : [query.status]) : undefined;
                        return [4 /*yield*/, this.searchObjects(dataStore, library, {
                                name: query.name,
                                author: username,
                                collection: query.collection,
                                status: status_1,
                                length: length_1,
                                level: level,
                                standardOutcomeIDs: query.standardOutcomeIDs,
                                text: query.text,
                                accessUnpublished: accessUnpublished,
                                orderBy: query.orderBy,
                                sortType: query.sortType,
                                currPage: query.page,
                                limit: query.limit
                            })];
                    case 1:
                        response = _a.sent();
                        summary = response.objects;
                        total = response.total;
                        return [3 /*break*/, 5];
                    case 2: return [4 /*yield*/, dataStore.getUserObjects(username)];
                    case 3:
                        objectIDs = _a.sent();
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(objectIDs, false, accessUnpublished, query ? query.orderBy : null, query ? query.sortType : null)];
                    case 4:
                        summary = _a.sent();
                        total = summary.length;
                        _a.label = 5;
                    case 5:
                        if (!loadChildren) return [3 /*break*/, 7];
                        return [4 /*yield*/, Promise.all(summary.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!(object.children && object.children.length)) return [3 /*break*/, 2];
                                            _a = object;
                                            return [4 /*yield*/, this.loadChildObjects(dataStore, library, object, false, accessUnpublished)];
                                        case 1:
                                            _a.children = _b.sent();
                                            _b.label = 2;
                                        case 2: return [2 /*return*/, object];
                                    }
                                });
                            }); }))];
                    case 6:
                        summary = _a.sent();
                        _a.label = 7;
                    case 7: return [4 /*yield*/, Promise.all(summary.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, e_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        _a = object;
                                        return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                    case 1:
                                        _a.metrics = _b.sent();
                                        return [2 /*return*/, object];
                                    case 2:
                                        e_2 = _b.sent();
                                        console.log(e_2);
                                        return [2 /*return*/, object];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 8:
                        summary = _a.sent();
                        return [2 /*return*/, summary];
                    case 9:
                        e_1 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem loading summary. Error: " + e_1)];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load a learning object and all its learning outcomes.
     * @async
     *
     * @param {UserID} author the author's database id
     * @param {string} name the learning object's identifying string
     *
     * @returns {LearningObject}
     */
    LearningObjectInteractor.loadLearningObject = function (dataStore, library, username, learningObjectName, accessUnpublished) {
        return __awaiter(this, void 0, void 0, function () {
            var fullChildren, learningObjectID, learningObject, _a, _b, e_3, e_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        fullChildren = false;
                        return [4 /*yield*/, dataStore.findLearningObject(username, learningObjectName)];
                    case 1:
                        learningObjectID = _c.sent();
                        return [4 /*yield*/, dataStore.fetchLearningObject(learningObjectID, true, accessUnpublished)];
                    case 2:
                        learningObject = _c.sent();
                        learningObject.id = learningObjectID;
                        if (!learningObject.children) return [3 /*break*/, 4];
                        _a = learningObject;
                        return [4 /*yield*/, this.loadChildObjects(dataStore, library, learningObject, fullChildren, accessUnpublished)];
                    case 3:
                        _a.children = _c.sent();
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        _b = learningObject;
                        return [4 /*yield*/, this.loadMetrics(library, learningObjectID)];
                    case 5:
                        _b.metrics = _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        e_3 = _c.sent();
                        console.log(e_3);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, learningObject];
                    case 8:
                        e_4 = _c.sent();
                        return [2 /*return*/, Promise.reject(e_4)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.loadChildObjects = function (dataStore, library, learningObject, full, accessUnpublished) {
        return __awaiter(this, void 0, void 0, function () {
            var children, _i, children_1, child, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!learningObject.children) return [3 /*break*/, 7];
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(learningObject.children, full, accessUnpublished)];
                    case 1:
                        children = _b.sent();
                        return [4 /*yield*/, Promise.all(children.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, e_5;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _b.sent();
                                            return [2 /*return*/, object];
                                        case 2:
                                            e_5 = _b.sent();
                                            console.log(e_5);
                                            return [2 /*return*/, object];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        children = _b.sent();
                        _i = 0, children_1 = children;
                        _b.label = 3;
                    case 3:
                        if (!(_i < children_1.length)) return [3 /*break*/, 6];
                        child = children_1[_i];
                        _a = child;
                        return [4 /*yield*/, this.loadChildObjects(dataStore, library, child, full, accessUnpublished)];
                    case 4:
                        _a.children = _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, children.slice()];
                    case 7: return [2 /*return*/, null];
                }
            });
        });
    };
    LearningObjectInteractor.fetchParents = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, params.dataStore.findParentObjects({
                                query: params.query
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_6 = _a.sent();
                        console.log(e_6);
                        return [2 /*return*/, Promise.reject("Problem fetching parent objects for " + params.query.id + ". Error: " + e_6)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.loadFullLearningObjectByIDs = function (dataStore, library, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObjects, e_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(ids, true)];
                    case 1:
                        learningObjects = _a.sent();
                        return [4 /*yield*/, Promise.all(learningObjects.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b, e_8;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _c.trys.push([0, 4, , 5]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _c.sent();
                                            if (!(object.children && object.children.length)) return [3 /*break*/, 3];
                                            _b = object;
                                            return [4 /*yield*/, this.loadChildObjects(dataStore, library, object, false, false)];
                                        case 2:
                                            _b.children = _c.sent();
                                            _c.label = 3;
                                        case 3: return [2 /*return*/, object];
                                        case 4:
                                            e_8 = _c.sent();
                                            console.log(e_8);
                                            return [2 /*return*/, object];
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        learningObjects = _a.sent();
                        return [2 /*return*/, learningObjects];
                    case 3:
                        e_7 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem loading full LearningObject by ID. Error: " + e_7)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks a learning object against submission criteria.
     *
     * @param object the learning object under question
     * @returns {string|null} An error message describing why the learning object isn't valid or null if it is.
     */
    LearningObjectInteractor.validateLearningObject = function (object) {
        // TODO: Move to entity
        var error = null;
        if (object.name.trim() === '') {
            error = 'Learning Object name cannot be empty.';
        }
        else if (object.published && !object.outcomes.length) {
            error = 'Learning Object must have outcomes to submit for review.';
        }
        else if (object.published && !object.goals[0].text) {
            error = 'Learning Object must have a description to submit for review.';
        }
        return error;
    };
    /**
     * Uploads File and adds file metadata to LearningObject's materials
     *
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     fileManager: FileManager;
     *     id: string;
     *     username: string;
     *     file: DZFile;
     *   }} params
     * @returns {Promise<void>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.uploadFile = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var loFile, uploadPath, fileUpload, hasChunks, url, e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        loFile = void 0;
                        uploadPath = params.username + "/" + params.id + "/" + (params.file.fullPath ? params.file.fullPath : params.file.name);
                        fileUpload = {
                            path: uploadPath,
                            data: params.file.buffer
                        };
                        hasChunks = +params.file.dztotalchunkcount;
                        if (!hasChunks) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processMultipartUpload({
                                dataStore: params.dataStore,
                                fileManager: params.fileManager,
                                id: params.id,
                                file: params.file,
                                fileUpload: fileUpload
                            })];
                    case 1:
                        // Process Multipart
                        loFile = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, params.fileManager.upload({ file: fileUpload })];
                    case 3:
                        url = _a.sent();
                        loFile = this.generateLearningObjectFile(params.file, url);
                        _a.label = 4;
                    case 4:
                        if (!loFile) return [3 /*break*/, 6];
                        // FIXME should be implemented in clark entity 
                        // @ts-ignore
                        loFile.size = params.file.size;
                        return [4 /*yield*/, this.updateMaterials({
                                loFile: loFile,
                                dataStore: params.dataStore,
                                id: params.id
                            })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, loFile];
                    case 7:
                        e_9 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem uploading file. Error: " + e_9)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancels multipart file upload
     *
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     fileManager: FileManager;
     *     uploadStatusId: string;
     *     filePath: string;
     *   }} params
     * @returns {Promise<void>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.cancelUpload = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadStatus, e_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, params.dataStore.fetchMultipartUploadStatus({
                                id: params.uploadStatusId
                            })];
                    case 1:
                        uploadStatus = _a.sent();
                        return [4 /*yield*/, this.abortMultipartUpload({
                                uploadId: uploadStatus.uploadId,
                                uploadStatusId: params.uploadStatusId,
                                path: uploadStatus.path,
                                fileManager: params.fileManager,
                                dataStore: params.dataStore
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 3:
                        e_10 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem canceling upload. Error: " + e_10)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.downloadSingleFile = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObject, fileMetaData, path, mimeType, stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, params.dataStore.fetchLearningObject(params.learningObjectId)];
                    case 1:
                        learningObject = _a.sent();
                        if (!learningObject) {
                            throw new Error("Learning object " + params.learningObjectId + " does not exist.");
                        }
                        return [4 /*yield*/, params.dataStore.findSingleFile({
                                learningObjectId: params.learningObjectId,
                                fileId: params.fileId
                            })];
                    case 2:
                        // Collect requested file metadata from datastore
                        fileMetaData = _a.sent();
                        if (!fileMetaData) {
                            return [2 /*return*/, Promise.reject({
                                    object: learningObject,
                                    message: "File not found"
                                })];
                        }
                        path = params.author + "/" + params.learningObjectId + "/" + (fileMetaData.fullPath ? fileMetaData.fullPath : fileMetaData.name);
                        mimeType = fileMetaData.fileType;
                        return [4 /*yield*/, params.fileManager.hasAccess(path)];
                    case 3:
                        // Check if the file manager has access to the resource before opening a stream
                        if (_a.sent()) {
                            stream = params.fileManager.streamFile({ path: path, objectName: learningObject.name });
                            return [2 /*return*/, { mimeType: mimeType, stream: stream, filename: fileMetaData.name }];
                        }
                        else {
                            throw { message: 'File not found', object: { name: learningObject.name } };
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Inserts metadata for file as LearningObjectFile
     *
     * @private
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     id: string;
     *     loFile: LearningObjectFile;
     *   }} params
     * @returns {Promise<void>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.updateMaterials = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, params.dataStore.addToFiles({
                                id: params.id,
                                loFile: params.loFile
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_11 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_11)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processes Multipart Uploads
     *
     * @private
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     fileManager: FileManager;
     *     id: string;
     *     username: string;
     *     file: DZFile;
     *     fileUpload: FileUpload;
     *   }} params
     * @returns {Promise<LearningObjectFile>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.processMultipartUpload = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadId, partNumber, uploadStatus, finish, completedPartList, multipartFileUpload, multipartData, loFile, e_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        partNumber = +params.file.dzchunkindex + 1;
                        return [4 /*yield*/, params.dataStore.fetchMultipartUploadStatus({ id: params.file.dzuuid })];
                    case 1:
                        uploadStatus = _a.sent();
                        finish = false;
                        completedPartList = void 0;
                        if (uploadStatus) {
                            uploadId = uploadStatus.uploadId;
                            finish = uploadStatus.partsUploaded + 1 === uploadStatus.totalParts;
                            completedPartList = uploadStatus.completedParts;
                        }
                        multipartFileUpload = __assign({}, params.fileUpload, { partNumber: partNumber,
                            uploadId: uploadId });
                        return [4 /*yield*/, params.fileManager.processMultipart({
                                finish: finish,
                                completedPartList: completedPartList,
                                file: multipartFileUpload
                            })];
                    case 2:
                        multipartData = _a.sent();
                        if (!!finish) return [3 /*break*/, 7];
                        if (!uploadStatus) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.updateUploadStatus({
                                dataStore: params.dataStore,
                                file: params.file,
                                uploadStatus: uploadStatus,
                                multipartData: multipartData
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        uploadId = multipartData.uploadId;
                        return [4 /*yield*/, this.createUploadStatus({
                                dataStore: params.dataStore,
                                file: params.file,
                                multipartData: multipartData
                            })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        loFile = this.generateLearningObjectFile(params.file, multipartData.url);
                        // Delete upload data
                        params.dataStore.deleteMultipartUploadStatus({
                            id: uploadStatus._id
                        });
                        return [2 /*return*/, loFile];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_12 = _a.sent();
                        this.abortMultipartUpload({
                            uploadId: uploadId,
                            fileManager: params.fileManager,
                            dataStore: params.dataStore,
                            uploadStatusId: params.file.dzuuid,
                            path: params.file.fullPath ? params.file.fullPath : params.file.name
                        });
                        return [2 /*return*/, Promise.reject(e_12)];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aborts multipart upload operation and deletes UploadStatus from DB
     *
     * @private
     * @static
     * @param {{
     *     uploadId: string;
     *     uploadStatusID: string;
     *     path: string;
     *     fileManager: FileManager;
     *     dataStore: DataStore;
     *   }} params
     * @returns {Promise<void>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.abortMultipartUpload = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, params.fileManager.cancelMultipart({
                                path: params.path,
                                uploadId: params.uploadId
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, params.dataStore.deleteMultipartUploadStatus({
                                id: params.uploadStatusId
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_13 = _a.sent();
                        console.log("Problem  aborting multipart upload. Error: " + e_13);
                        return [2 /*return*/, Promise.reject(e_13)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *
     * Creates new UploadStatus
     * @private
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     file: DZFile;
     *     multipartData: MultipartUploadData;
     *   }} params
     * @returns Promise<void>
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.createUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadStatus, e_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        uploadStatus = {
                            _id: params.file.dzuuid,
                            uploadId: params.multipartData.uploadId,
                            totalParts: +params.file.dztotalchunkcount,
                            partsUploaded: 1,
                            fileSize: +params.file.size,
                            path: params.file.fullPath ? params.file.fullPath : params.file.name,
                            bytesUploaded: +params.file.dzchunksize,
                            completedParts: [params.multipartData.completedPart],
                            createdAt: Date.now().toString()
                        };
                        return [4 /*yield*/, params.dataStore.insertMultipartUploadStatus({
                                status: uploadStatus
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_14 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_14)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates UploadStatus
     *
     * @private
     * @static
     * @param {{
     *     dataStore: DataStore;
     *     file: DZFile;
     *     uploadStatus: MultipartFileUploadStatus;
     *     multipartData: MultipartUploadData;
     *   }} params
     * @returns {Promise<void>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.updateUploadStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, e_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        updates = {
                            partsUploaded: params.uploadStatus.partsUploaded + 1,
                            bytesUploaded: params.uploadStatus.bytesUploaded + +params.file.dzchunksize
                        };
                        return [4 /*yield*/, params.dataStore.updateMultipartUploadStatus({
                                updates: updates,
                                id: params.uploadStatus._id,
                                completedPart: params.multipartData.completedPart
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_15 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_15)];
                    case 3: return [2 /*return*/];
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
    LearningObjectInteractor.findLearningObject = function (dataStore, username, learningObjectName) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObjectID, e_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.findLearningObject(username, learningObjectName)];
                    case 1:
                        learningObjectID = _a.sent();
                        return [2 /*return*/, learningObjectID];
                    case 2:
                        e_16 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem finding LearningObject. Error: " + e_16)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.deleteMultipleLearningObjects = function (dataStore, fileManager, library, username, learningObjectNames) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObjectIDs, learningObjectsWithFiles, _i, learningObjectsWithFiles_1, object, path, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, Promise.all(learningObjectNames.map(function (name) {
                                return dataStore.findLearningObject(username, name);
                            }))];
                    case 1:
                        learningObjectIDs = _a.sent();
                        return [4 /*yield*/, dataStore.deleteMultipleLearningObjects(learningObjectIDs)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(learningObjectIDs)];
                    case 3:
                        learningObjectsWithFiles = _a.sent();
                        _i = 0, learningObjectsWithFiles_1 = learningObjectsWithFiles;
                        _a.label = 4;
                    case 4:
                        if (!(_i < learningObjectsWithFiles_1.length)) return [3 /*break*/, 7];
                        object = learningObjectsWithFiles_1[_i];
                        path = username + "/" + object.id + "/";
                        return [4 /*yield*/, fileManager.deleteAll({ path: path })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [4 /*yield*/, library.cleanObjectsFromLibraries(learningObjectIDs)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem deleting Learning Objects. Error: " + error_1)];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Return literally all objects. Very expensive.
     * @returns {LearningObject[]} array of literally all objects
     */
    LearningObjectInteractor.fetchAllObjects = function (dataStore, library, currPage, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var accessUnpublished, response, _a, e_17;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        accessUnpublished = false;
                        return [4 /*yield*/, dataStore.fetchAllObjects(accessUnpublished, currPage, limit)];
                    case 1:
                        response = _b.sent();
                        _a = response;
                        return [4 /*yield*/, Promise.all(response.objects.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, e_18;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _b.sent();
                                            return [2 /*return*/, object];
                                        case 2:
                                            e_18 = _b.sent();
                                            console.log(e_18);
                                            return [2 /*return*/, object];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.objects = _b.sent();
                        return [2 /*return*/, response];
                    case 3:
                        e_17 = _b.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching all Learning Objects. Error: " + e_17)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * TODO: Refactor into fetchAllObjects. DRY
     * Returns array of learning objects associated with the given ids.
     * @returns {LearningObjectRecord[]}
     */
    LearningObjectInteractor.fetchMultipleObjects = function (dataStore, library, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObjectIDs, learningObjects, e_19;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.all(ids.map(function (id) {
                                return new Promise(function (resolve, reject) {
                                    dataStore
                                        .findLearningObject(id.username, id.learningObjectName)
                                        .then(function (learningObjectID) { return resolve(learningObjectID); }, function (err) { return reject(err); });
                                });
                            }))];
                    case 1:
                        learningObjectIDs = _a.sent();
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(learningObjectIDs, false, true)];
                    case 2:
                        learningObjects = _a.sent();
                        return [4 /*yield*/, Promise.all(learningObjects.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, e_20;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _b.sent();
                                            return [2 /*return*/, object];
                                        case 2:
                                            e_20 = _b.sent();
                                            console.log(e_20);
                                            return [2 /*return*/, object];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 3:
                        learningObjects = _a.sent();
                        return [2 /*return*/, learningObjects];
                    case 4:
                        e_19 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching multiple Learning Objects. Error: " + e_19)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.fetchObjectsByIDs = function (dataStore, library, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var learningObjects, e_21;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, dataStore.fetchMultipleObjects(ids, true, true)];
                    case 1:
                        learningObjects = _a.sent();
                        return [4 /*yield*/, Promise.all(learningObjects.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, e_22;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _b.sent();
                                            return [2 /*return*/, object];
                                        case 2:
                                            e_22 = _b.sent();
                                            console.log(e_22);
                                            return [2 /*return*/, object];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        learningObjects = _a.sent();
                        return [2 /*return*/, learningObjects];
                    case 3:
                        e_21 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching LearningObjects by ID. Error: " + e_21)];
                    case 4: return [2 /*return*/];
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
    LearningObjectInteractor.searchObjects = function (dataStore, library, params) {
        return __awaiter(this, void 0, void 0, function () {
            var firstChar, lastChar, response, _a, e_23;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        if (params.text) {
                            firstChar = params.text.charAt(0);
                            lastChar = params.text.charAt(params.text.length - 1);
                            if (firstChar !== "\"" && lastChar !== "\"") {
                                params.text = this.removeStopwords(params.text);
                            }
                        }
                        return [4 /*yield*/, dataStore.searchObjects({
                                name: params.name,
                                author: params.author,
                                collection: params.collection,
                                status: params.status,
                                length: params.length,
                                level: params.level,
                                standardOutcomeIDs: params.standardOutcomeIDs,
                                text: params.text,
                                accessUnpublished: params.accessUnpublished,
                                orderBy: params.orderBy,
                                sortType: params.sortType,
                                page: params.currPage,
                                limit: params.limit,
                                released: params.released
                            })];
                    case 1:
                        response = _b.sent();
                        _a = response;
                        return [4 /*yield*/, Promise.all(response.objects.map(function (object) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, e_24;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            _a = object;
                                            return [4 /*yield*/, this.loadMetrics(library, object.id)];
                                        case 1:
                                            _a.metrics = _b.sent();
                                            return [2 /*return*/, object];
                                        case 2:
                                            e_24 = _b.sent();
                                            console.log(e_24);
                                            return [2 /*return*/, object];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.objects = _b.sent();
                        return [2 /*return*/, response];
                    case 3:
                        e_23 = _b.sent();
                        return [2 /*return*/, Promise.reject("Problem suggesting Learning Objects. Error:" + e_23)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.fetchCollections = function (dataStore) {
        return __awaiter(this, void 0, void 0, function () {
            var collections, e_25;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.fetchCollections()];
                    case 1:
                        collections = _a.sent();
                        return [2 /*return*/, collections];
                    case 2:
                        e_25 = _a.sent();
                        console.error(e_25);
                        return [2 /*return*/, Promise.reject("Problem fetching collections. Error: " + e_25)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.fetchCollection = function (dataStore, name) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, e_26;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.fetchCollection(name)];
                    case 1:
                        collection = _a.sent();
                        return [2 /*return*/, collection];
                    case 2:
                        e_26 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching collection. Error: " + e_26)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.fetchCollectionMeta = function (dataStore, name) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionMeta, e_27;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.fetchCollectionMeta(name)];
                    case 1:
                        collectionMeta = _a.sent();
                        return [2 /*return*/, collectionMeta];
                    case 2:
                        e_27 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching collection metadata. Error: " + e_27)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.fetchCollectionObjects = function (dataStore, name) {
        return __awaiter(this, void 0, void 0, function () {
            var objects, e_28;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.fetchCollectionObjects(name)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                    case 2:
                        e_28 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem fetching collection objects. Error: " + e_28)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.addToCollection = function (dataStore, learningObjectId, collection) {
        return __awaiter(this, void 0, void 0, function () {
            var e_29;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dataStore.addToCollection(learningObjectId, collection)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_29 = _a.sent();
                        console.log(e_29);
                        return [2 /*return*/, Promise.reject(e_29)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.setChildren = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var parentID, e_30;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, params.dataStore.findLearningObject(params.username, params.parentName)];
                    case 1:
                        parentID = _a.sent();
                        return [2 /*return*/, params.dataStore.setChildren(parentID, params.children)];
                    case 2:
                        e_30 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem adding child. Error: " + e_30)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LearningObjectInteractor.removeChild = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var parentID, e_31;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, params.dataStore.findLearningObject(params.username, params.parentName)];
                    case 1:
                        parentID = _a.sent();
                        return [2 /*return*/, params.dataStore.deleteChild(parentID, params.childId)];
                    case 2:
                        e_31 = _a.sent();
                        return [2 /*return*/, Promise.reject("Problem removing child. Error: " + e_31)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches Metrics for Learning Object
     *
     * @private
     * @static
     * @param {string} objectID
     * @returns {Promise<Metrics>}
     * @memberof LearningObjectInteractor
     */
    LearningObjectInteractor.loadMetrics = function (library, objectID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, library.getMetrics(objectID)];
                }
                catch (e) {
                    return [2 /*return*/, Promise.reject(e)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Returns string without stopwords
     *
     * @private
     * @static
     * @param {string} text
     * @returns {string}
     * @memberof SuggestionInteractor
     */
    LearningObjectInteractor.removeStopwords = function (text) {
        var oldString = text.split(' ');
        text = stopword
            .removeStopwords(oldString)
            .join(' ')
            .trim();
        return text;
    };
    /**
     * Generates new LearningObjectFile Object
     *
     * @private
     * @param {any} file
     * @returns
     * @memberof S3Driver
     */
    LearningObjectInteractor.generateLearningObjectFile = function (file, url) {
        var extMatch = file.name.match(/(\.[^.]*$|$)/);
        var extension = extMatch ? extMatch[0] : '';
        var date = Date.now().toString();
        var learningObjectFile = {
            url: url,
            date: date,
            id: file.dzuuid,
            name: file.name,
            fileType: file.mimetype,
            extension: extension,
            fullPath: file.fullPath,
            packageable: this.isPackageable(file)
        };
        return learningObjectFile;
    };
    LearningObjectInteractor.isPackageable = function (file) {
        // if dztotalfilesize doesn't exist it must not be a chunk upload.
        // this means by default it must be a packageable file size
        return !(file.dztotalfilesize > MAX_PACKAGEABLE_FILE_SIZE);
    };
    return LearningObjectInteractor;
}());
exports.LearningObjectInteractor = LearningObjectInteractor;
/**
 * Replaces illegal file path characters with '_'.
 * Truncates string if longer than file path's legal max length of 250 (Windows constraint was said to be somewhere between 247-260);
 * .zip extension will make the max length go to 254 which is still within the legal range
 *
 * @export
 * @param {string} name
 * @returns {string}
 */
var MAX_CHAR = 250;
function sanitizeFileName(name) {
    var clean = name.replace(/[\\/:"*?<>|]/gi, '_');
    if (clean.length > MAX_CHAR) {
        clean = clean.slice(0, MAX_CHAR);
    }
    return clean;
}
exports.sanitizeFileName = sanitizeFileName;
