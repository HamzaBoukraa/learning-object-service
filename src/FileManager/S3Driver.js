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
var AWS = require("aws-sdk");
var aws_sdk_config_1 = require("./aws-sdk.config");
var SentryConnector_1 = require("../drivers/SentryConnector");
AWS.config.credentials = aws_sdk_config_1.AWS_SDK_CONFIG.credentials;
var AWS_S3_BUCKET = 'neutrino-file-uploads';
var AWS_S3_ACL = 'public-read';
var S3Driver = /** @class */ (function () {
    function S3Driver() {
        this.s3 = new AWS.S3({ region: aws_sdk_config_1.AWS_SDK_CONFIG.region });
    }
    /**
     * Uploads single file
     *
     * @param {{ file: FileUpload }} params
     * @returns {Promise<string>}
     * @memberof S3Driver
     */
    S3Driver.prototype.upload = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadParams, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        uploadParams = {
                            Bucket: AWS_S3_BUCKET,
                            Key: params.file.path,
                            ACL: AWS_S3_ACL,
                            Body: params.file.data
                        };
                        return [4 /*yield*/, this.s3.upload(uploadParams).promise()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.Location];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_1)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processes Chunk uploads
     * If there is trouble with the upload AWS auto aborts multipart upload
     * @param {{
     *     file: MultipartFileUpload;
     *     finish?: boolean;
     *     completedPartList?: CompletedPartList;
     *   }} params
     * @returns {Promise<MultipartUploadData>}
     * @memberof S3Driver
     */
    S3Driver.prototype.processMultipart = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var createParams, createdUpload, partUploadParams, uploadData, completedParams, completedUploadData, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        if (!!params.file.uploadId) return [3 /*break*/, 2];
                        createParams = {
                            Bucket: AWS_S3_BUCKET,
                            ACL: AWS_S3_ACL,
                            Key: params.file.path
                        };
                        return [4 /*yield*/, this.s3
                                .createMultipartUpload(createParams)
                                .promise()];
                    case 1:
                        createdUpload = _a.sent();
                        params.file.uploadId = createdUpload.UploadId;
                        _a.label = 2;
                    case 2:
                        partUploadParams = {
                            Bucket: AWS_S3_BUCKET,
                            Key: params.file.path,
                            Body: params.file.data,
                            PartNumber: params.file.partNumber,
                            UploadId: params.file.uploadId
                        };
                        return [4 /*yield*/, this.s3.uploadPart(partUploadParams).promise()];
                    case 3:
                        uploadData = _a.sent();
                        if (!params.finish) return [3 /*break*/, 5];
                        // append final part to parts list before uploading
                        params.completedPartList.push({
                            ETag: uploadData.ETag,
                            PartNumber: params.file.partNumber
                        });
                        completedParams = {
                            Bucket: AWS_S3_BUCKET,
                            Key: params.file.path,
                            UploadId: params.file.uploadId,
                            MultipartUpload: {
                                Parts: params.completedPartList
                            }
                        };
                        return [4 /*yield*/, this.s3
                                .completeMultipartUpload(completedParams)
                                .promise()];
                    case 4:
                        completedUploadData = _a.sent();
                        return [2 /*return*/, { url: completedUploadData.Location }];
                    case 5: return [2 /*return*/, {
                            uploadId: params.file.uploadId,
                            completedPart: {
                                ETag: uploadData.ETag,
                                PartNumber: params.file.partNumber
                            }
                        }];
                    case 6:
                        e_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_2)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancels chunk upload
     *
     * @param {{
     *     path: string;
     *     uploadId: string;
     *   }} params
     * @returns {Promise<void>}
     * @memberof S3Driver
     */
    S3Driver.prototype.cancelMultipart = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var abortUploadParams, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        abortUploadParams = {
                            Bucket: AWS_S3_BUCKET,
                            Key: params.path,
                            UploadId: params.uploadId
                        };
                        return [4 /*yield*/, this.s3.abortMultipartUpload(abortUploadParams).promise()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 2:
                        e_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_3)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes Specified file from storage
     *
     * @param {string} path
     * @returns {Promise<void>}
     * @memberof S3Driver
     */
    S3Driver.prototype["delete"] = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var deleteParams, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        deleteParams = {
                            Bucket: AWS_S3_BUCKET,
                            Key: params.path
                        };
                        return [4 /*yield*/, this.deleteObject(deleteParams)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_4 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_4)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes all files in storage
     *
     * @param {string} path
     * @returns {Promise<void>}
     * @memberof S3Driver
     */
    S3Driver.prototype.deleteAll = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var listParams, listedObjects, deleteParams, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        listParams = {
                            Bucket: AWS_S3_BUCKET,
                            Prefix: params.path
                        };
                        return [4 /*yield*/, this.s3.listObjectsV2(listParams).promise()];
                    case 1:
                        listedObjects = _a.sent();
                        deleteParams = {
                            Bucket: AWS_S3_BUCKET,
                            Delete: {
                                Objects: listedObjects.Contents.map(function (_a) {
                                    var Key = _a.Key;
                                    return ({ Key: Key });
                                })
                            }
                        };
                        return [4 /*yield*/, this.s3.deleteObjects(deleteParams).promise()];
                    case 2:
                        _a.sent();
                        if (!listedObjects.IsTruncated) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.deleteAll(params)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/, Promise.resolve()];
                    case 5:
                        e_5 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_5)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    S3Driver.prototype.streamFile = function (params) {
        var fetchParams = {
            Bucket: AWS_S3_BUCKET,
            Key: params.path
        };
        var stream = this.s3
            .getObject(fetchParams)
            .createReadStream()
            .on('error', function (err) {
            // TimeoutError will be thrown if the client cancels the download
            if (err.code !== 'TimeoutError') {
                SentryConnector_1.reportError(err);
            }
        });
        return stream;
    };
    /**
     * Deletes Object From S3
     *
     * @private
     * @param {any} params
     * @returns {Promise<void>}
     * @memberof S3Driver
     */
    S3Driver.prototype.deleteObject = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.s3.deleteObject(params).promise()];
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
    /**
     * Sends a HEAD request to fetch metadata for a given file.
     * Resolves true if the request completes, and false if the request
     * stream encounters an error at any point.
     *
     * @param path the file path in S3
     */
    S3Driver.prototype.hasAccess = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var fetchParams;
            var _this = this;
            return __generator(this, function (_a) {
                fetchParams = {
                    Bucket: AWS_S3_BUCKET,
                    Key: path
                };
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.s3
                            .headObject(fetchParams)
                            .createReadStream()
                            .on('finish', function (_) { return resolve(true); })
                            .on('error', function (e) {
                            resolve(false);
                            SentryConnector_1.reportError(e);
                        });
                    })];
            });
        });
    };
    return S3Driver;
}());
exports.S3Driver = S3Driver;
