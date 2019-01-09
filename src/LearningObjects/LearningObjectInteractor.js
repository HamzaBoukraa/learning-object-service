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
var interactors_1 = require("../interactors/interactors");
var PDFKitDriver_1 = require("./PDFKitDriver");
/**
 * Add a new learning object to the database.
 * NOTE: this function only adds basic fields;
 *       the user.outcomes field is ignored
 * NOTE: promise rejected if another learning object
 *       tied to the same author and with the same 'name' field
 *       already exists
 *
 * @async
 *
 * @param {UserID} author - database id of the parent
 * @param {LearningObject} object - entity to add
 *
 * @returns {LearningObjectID} the database id of the new record
 */
function addLearningObject(dataStore, fileManager, object) {
    return __awaiter(this, void 0, void 0, function () {
        var err, learningObjectID, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    err = interactors_1.LearningObjectInteractor.validateLearningObject(object);
                    if (!err) return [3 /*break*/, 1];
                    return [2 /*return*/, Promise.reject(err)];
                case 1: return [4 /*yield*/, dataStore.insertLearningObject(object)];
                case 2:
                    learningObjectID = _a.sent();
                    object.id = learningObjectID;
                    return [4 /*yield*/, updateReadme({
                            fileManager: fileManager,
                            object: object,
                            dataStore: dataStore
                        })];
                case 3:
                    // Generate PDF and update Learning Object with PDF meta.
                    object = _a.sent();
                    updateLearningObject(dataStore, fileManager, object.id, object);
                    return [2 /*return*/, object];
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    // The duplicate key error is produced by Mongo, via a constraint on the authorID/name compound index
                    // FIXME: This should be an error that is encapsulated within the MongoDriver, since it is specific to Mongo's indexing functionality
                    if (/duplicate key error/gi.test(e_1)) {
                        return [2 /*return*/, Promise.reject("Could not save Learning Object. Learning Object with name: " + object.name + " already exists.")];
                    }
                    return [2 /*return*/, Promise.reject("Problem creating Learning Object. Error" + e_1)];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.addLearningObject = addLearningObject;
/**
 * Update an existing learning object record.
 * NOTE: promise rejected if another learning object
 *       tied to the same author and with the same 'name' field
 *       already exists
 *
 * @async
 *
 * @param {LearningObjectID} id - database id of the record to change
 * @param {LearningObject} object - entity with values to update to
 */
function updateLearningObject(dataStore, fileManager, id, object) {
    return __awaiter(this, void 0, void 0, function () {
        var err, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    err = interactors_1.LearningObjectInteractor.validateLearningObject(object);
                    if (!!err) return [3 /*break*/, 3];
                    return [4 /*yield*/, updateReadme({
                            dataStore: dataStore,
                            fileManager: fileManager,
                            object: object
                        })];
                case 1:
                    object = _a.sent();
                    return [4 /*yield*/, dataStore.editLearningObject(id, object)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: throw new Error(err);
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_2 = _a.sent();
                    return [2 /*return*/, Promise.reject("Problem updating Learning Object. Error: " + e_2)];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.updateLearningObject = updateLearningObject;
function deleteLearningObject(dataStore, fileManager, username, learningObjectName, library) {
    return __awaiter(this, void 0, void 0, function () {
        var learningObjectID, learningObject, path, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, dataStore.findLearningObject(username, learningObjectName)];
                case 1:
                    learningObjectID = _a.sent();
                    return [4 /*yield*/, dataStore.fetchLearningObject(learningObjectID, false, true)];
                case 2:
                    learningObject = _a.sent();
                    return [4 /*yield*/, dataStore.deleteLearningObject(learningObjectID)];
                case 3:
                    _a.sent();
                    if (!learningObject.materials.files.length) return [3 /*break*/, 5];
                    path = username + "/" + learningObjectID + "/";
                    return [4 /*yield*/, fileManager.deleteAll({ path: path })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    library.cleanObjectsFromLibraries([learningObjectID]);
                    return [2 /*return*/, Promise.resolve()];
                case 6:
                    error_1 = _a.sent();
                    return [2 /*return*/, Promise.reject("Problem deleting Learning Object. Error: " + error_1)];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.deleteLearningObject = deleteLearningObject;
/**
 * Updates Readme PDF for Learning Object
 *
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     fileManager: FileManager;
 *     object?: LearningObject;
 *     id?: string;
 *   }} params
 * @returns {Promise<LearningObject>}
 * @memberof LearningObjectInteractor
 */
function updateReadme(params) {
    return __awaiter(this, void 0, void 0, function () {
        var object, id, oldPDF, pdf, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    object = params.object;
                    id = params.id;
                    if (!(!object && id)) return [3 /*break*/, 2];
                    return [4 /*yield*/, params.dataStore.fetchLearningObject(id, true, true)];
                case 1:
                    object = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    if (!object && !id) {
                        throw new Error("No learning object or id provided.");
                    }
                    _a.label = 3;
                case 3:
                    oldPDF = object.materials['pdf'];
                    return [4 /*yield*/, PDFKitDriver_1.generatePDF(params.fileManager, object)];
                case 4:
                    pdf = _a.sent();
                    if (oldPDF && oldPDF.name !== pdf.name) {
                        deleteFile(params.fileManager, object.id, object.author.username, oldPDF.name);
                    }
                    object.materials['pdf'] = {
                        name: pdf.name,
                        url: pdf.url
                    };
                    return [2 /*return*/, object];
                case 5:
                    e_3 = _a.sent();
                    return [2 /*return*/, Promise.reject("Problem updating Readme for learning object. Error: " + e_3)];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.updateReadme = updateReadme;
/**
 * Deletes specified file
 *
 * @static
 * @param {FileManager} fileManager
 * @param {string} id
 * @param {string} username
 * @param {string} filename
 * @returns {Promise<void>}
 * @memberof LearningObjectInteractor
 */
function deleteFile(fileManager, id, username, filename) {
    return __awaiter(this, void 0, void 0, function () {
        var path;
        return __generator(this, function (_a) {
            try {
                path = username + "/" + id + "/" + filename;
                return [2 /*return*/, fileManager["delete"]({ path: path })];
            }
            catch (e) {
                return [2 /*return*/, Promise.reject("Problem deleting file. Error: " + e)];
            }
            return [2 /*return*/];
        });
    });
}
exports.deleteFile = deleteFile;
