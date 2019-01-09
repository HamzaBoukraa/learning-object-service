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
var PDFKit = require("pdfkit");
var routes_1 = require("../routes");
var striptags = require("striptags");
var PDFFonts;
(function (PDFFonts) {
    PDFFonts["REGULAR"] = "Helvetica";
    PDFFonts["BOLD"] = "Helvetica-Bold";
})(PDFFonts || (PDFFonts = {}));
var PDFFontSizes;
(function (PDFFontSizes) {
    PDFFontSizes[PDFFontSizes["JUMBO"] = 25] = "JUMBO";
    PDFFontSizes[PDFFontSizes["LARGE"] = 20] = "LARGE";
    PDFFontSizes[PDFFontSizes["MEDIUM"] = 18] = "MEDIUM";
    PDFFontSizes[PDFFontSizes["REGULAR"] = 14.5] = "REGULAR";
})(PDFFontSizes || (PDFFontSizes = {}));
var PDFColors;
(function (PDFColors) {
    PDFColors["TEXT"] = "#333";
    PDFColors["DARK_TEXT"] = "#3b3c3e";
    PDFColors["LINK"] = "#1B9CFC";
    PDFColors["BANNER"] = "#3b608b";
    PDFColors["WHITE"] = "#FFF";
    PDFColors["DARK_BLUE"] = "#2b4066";
    PDFColors["LIGHT_BLUE"] = "#3b608b";
})(PDFColors || (PDFColors = {}));
var PDFText;
(function (PDFText) {
    PDFText["CREATOR"] = "C.L.A.R.K. | Cybersecurity Labs and Resource Knowledge-base";
    PDFText["COVER_PAGE_TITLE"] = "CLARK | Cybersecurity Labs and Resource Knowledge-base";
    PDFText["OUTCOMES_TITLE"] = "Outcomes";
    PDFText["DESCRIPTION_TITLE"] = "Description";
    PDFText["MATERIALS_TITLE"] = "Content";
    PDFText["UNPACKED_FILES_TITLE"] = "Resources";
    PDFText["UNPACKED_FILES_DESCRIPTION"] = "These materials on CLARK are required to use this learning object.";
    PDFText["ASSESSMENTS_TITLE"] = "Assessments";
    PDFText["INSTRUCTIONAL_STRATEGIES_TITLE"] = "Instructional Strategies";
    PDFText["URLS_TITLE"] = "Links";
    PDFText["NOTES_TITLE"] = "Notes";
})(PDFText || (PDFText = {}));
/**
 * Generates PDF for Learning Object
 *
 * @private
 * @static
 * @param {FileManager} fileManager
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function generatePDF(fileManager, learningObject) {
    // Create new Doc and Track Stream
    var doc = new PDFKit();
    // Create array to catch Buffers
    var buffers = [];
    // Add Event Handlers
    var pdf = addEventListeners(fileManager, doc, buffers, learningObject);
    var gradientRGB = [0, 0, 650, 0];
    // MetaData
    appendMetaData(doc, learningObject);
    // Cover Page
    appendGradientHeader({
        gradientRGB: gradientRGB,
        doc: doc,
        title: PDFText.COVER_PAGE_TITLE,
        headerYStart: 0,
        textXStart: 100,
        textYStart: 22
    });
    appendCoverPage(doc, learningObject);
    doc.addPage();
    // Description TEMP REMOVAL
    // if (learningObject.goals.length) {
    //   appendGradientHeader({
    //     gradientRGB,
    //     doc,
    //     title: PDFText.DESCRIPTION_TITLE,
    //     headerYStart: doc.y - 75,
    //     textYStart: doc.y - 70 + 20,
    //   });
    //   appendLearningGoals(doc, learningObject);
    // }
    // Outcomes
    if (learningObject.outcomes.length) {
        appendGradientHeader({
            gradientRGB: gradientRGB,
            doc: doc,
            title: PDFText.OUTCOMES_TITLE,
            headerYStart: doc.y - 75,
            textYStart: doc.y - 70 + 20
        });
        appendOutcomes(doc, learningObject);
    }
    // Content (Urls)
    if (learningObject.materials.urls.length || learningObject.materials.notes) {
        appendGradientHeader({
            gradientRGB: gradientRGB,
            doc: doc,
            title: PDFText.MATERIALS_TITLE
        });
        appendTextMaterials(doc, learningObject);
    }
    // Unpacked Files
    var unpackedFiles = learningObject.materials.files.filter(function (f) { return !f['packageable']; });
    if (unpackedFiles.length) {
        appendGradientHeader({
            gradientRGB: gradientRGB,
            doc: doc,
            title: PDFText.UNPACKED_FILES_TITLE
        });
        appendUnpackedFileURLs({
            doc: doc,
            files: unpackedFiles,
            id: learningObject.id,
            username: learningObject.author.username
        });
    }
    doc.end();
    return pdf;
}
exports.generatePDF = generatePDF;
/**
 * Adds event listeners to PDF write process
 *
 * @private
 * @static
 * @param {FileManager} fileManager
 * @param {PDFKit.PDFDocument} doc
 * @param {Buffer[]} buffers
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function addEventListeners(fileManager, doc, buffers, learningObject) {
    var _this = this;
    doc.on('data', function (data) {
        buffers.push(data);
    });
    doc.on('error', function (e) {
        console.log(e);
    });
    return new Promise(function (resolve) {
        doc.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
            var buffer, fileName, path, fileUpload, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buffer = Buffer.concat(buffers);
                        fileName = "0ReadMeFirst - " + learningObject.name + ".pdf";
                        path = learningObject.author.username + "/" + learningObject.id + "/" + fileName;
                        fileUpload = {
                            path: path,
                            data: buffer
                        };
                        return [4 /*yield*/, fileManager.upload({ file: fileUpload })];
                    case 1:
                        url = _a.sent();
                        resolve({
                            url: url,
                            name: fileName
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
}
/**
 * Adds MetaData to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendMetaData(doc, learningObject) {
    doc.info.Title = learningObject.name;
    doc.info.Author = learningObject.author.name;
    doc.info.Creator = PDFText.CREATOR;
    doc.info.CreationDate = new Date(+learningObject.date);
    doc.info.ModDate = new Date();
}
/**
 * Adds Cover Page to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendCoverPage(doc, learningObject) {
    doc.moveDown(8);
    doc
        .fontSize(PDFFontSizes.JUMBO)
        .fillColor(PDFColors.TEXT)
        .text(learningObject.name, { align: 'center' });
    doc.moveDown(2);
    doc.font(PDFFonts.REGULAR);
    doc.fontSize(PDFFontSizes.LARGE).text(learningObject.length.toUpperCase(), {
        align: 'center'
    });
    doc.moveDown(2);
    var authorName = titleCase(learningObject.author.name);
    doc.fontSize(PDFFontSizes.MEDIUM).text(authorName + " - " + new Date(+learningObject.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }), { align: 'center' });
}
/**
 * Adds Learning Goals to PDF Document
 *
 * @private
 * @static
 * @param {number[]} gradientRGB
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendLearningGoals(doc, learningObject) {
    doc
        .fillColor(PDFColors.TEXT)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.REGULAR);
    // Only get first goal for 'description'
    var goal = learningObject.goals[0];
    // Strip html tags from rich text
    var text = striptags(goal.text);
    doc.text(text);
    doc.moveDown(0.5);
    doc.moveDown(2);
}
/**
 * Appends Outcomes to PDF Document
 *
 * @private
 * @static
 * @param {number[]} gradientRGB
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendOutcomes(doc, learningObject) {
    learningObject.outcomes.forEach(function (outcome) {
        appendOutcomeHeader(doc, outcome);
        // Assessments
        if (outcome.assessments.length) {
            appendOutcomeAssessments(doc, outcome);
        }
        // Instructional Strategies
        if (outcome.strategies.length) {
            appendOutcomeStrategies(doc, outcome);
        }
        doc.moveDown(2);
    });
}
/**
 * Appends Header for Outcome Section
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningOutcome} outcome
 * @memberof LearningObjectInteractor
 */
function appendOutcomeHeader(doc, outcome) {
    doc
        .fillColor(PDFColors.BANNER)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD);
    doc.text(outcome.bloom);
    doc.moveDown(0.5);
    doc
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.REGULAR)
        .fillColor(PDFColors.TEXT);
    doc.text("Students will be able to " + outcome.verb.toLowerCase() + " " + outcome.text);
}
/**
 * Appends Outcome Assessments to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningOutcome} outcome
 * @memberof LearningObjectInteractor
 */
function appendOutcomeAssessments(doc, outcome) {
    doc
        .fillColor(PDFColors.BANNER)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD);
    doc.text(PDFText.ASSESSMENTS_TITLE);
    doc.moveDown(0.5);
    outcome.assessments.forEach(function (assessment) {
        doc.fillColor(PDFColors.TEXT);
        doc.text(assessment.plan);
        doc.moveDown(0.5);
        doc.font(PDFFonts.REGULAR);
        doc.text(assessment.text);
        doc.moveDown(0.5);
    });
    doc.moveDown(1);
}
/**
 * Appends Outcome Strategies to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningOutcome} outcome
 * @memberof LearningObjectInteractor
 */
function appendOutcomeStrategies(doc, outcome) {
    doc
        .fillColor(PDFColors.BANNER)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD);
    doc.text(PDFText.INSTRUCTIONAL_STRATEGIES_TITLE);
    doc.moveDown(0.5);
    outcome.strategies.forEach(function (strategy) {
        doc.fillColor(PDFColors.TEXT);
        doc.text(strategy.plan);
        doc.moveDown(0.5);
        doc.font(PDFFonts.REGULAR);
        doc.text(strategy.text);
        doc.moveDown(0.5);
    });
    doc.moveDown(1);
}
/**
 * Appends Text Based Materials to PDF Document
 *
 * @private
 * @static
 * @param {number[]} gradientRGB
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendTextMaterials(doc, learningObject) {
    // Content (URLs)
    if (learningObject.materials.urls.length) {
        appendMaterialURLs(doc, learningObject);
    }
    // Content (Notes)
    if (learningObject.materials.notes) {
        appendMaterialNotes(doc, learningObject);
    }
    doc.moveDown(2);
}
/**
 * Appends Material URLs to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendMaterialURLs(doc, learningObject) {
    doc
        .fillColor(PDFColors.BANNER)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD);
    doc.text(PDFText.URLS_TITLE);
    doc.moveDown(0.5);
    learningObject.materials.urls.forEach(function (url) {
        doc.fillColor(PDFColors.DARK_TEXT);
        doc.text(url.title);
        doc.moveDown(0.25);
        doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
        doc.text("" + url.url, doc.x, doc.y, {
            link: url.url,
            underline: true
        });
        doc.moveDown(0.5);
    });
    doc.moveDown(1);
}
/**
 * Appends Material Notes to PDF Document
 *
 * @private
 * @static
 * @param {PDFKit.PDFDocument} doc
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
function appendMaterialNotes(doc, learningObject) {
    doc
        .fillColor(PDFColors.BANNER)
        .fontSize(PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD);
    doc.text(PDFText.NOTES_TITLE);
    doc.moveDown(0.5);
    doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
    // Print lines with individual api calls to avoid malformed
    var lines = learningObject.materials.notes
        .split(/\n/g)
        .filter(function (line) { return line; });
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        doc.text(line);
        doc.moveDown(0.5);
    }
}
/**
 * Appends Unpacked file URLs to PDF Document
 *
 * @private
 * @static
 * @param {GradientVector} gradientRGB
 * @param {PDFKit.PDFDocument} doc
 * @param {files} LearningObjectFile[]
 * @memberof LearningObjectInteractor
 */
function appendUnpackedFileURLs(params) {
    params.doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
    params.doc.text(PDFText.UNPACKED_FILES_DESCRIPTION, { align: 'center' });
    params.doc.moveDown(2);
    params.files.forEach(function (file) {
        params.doc.fillColor(PDFColors.DARK_TEXT);
        params.doc.text(file.name);
        params.doc.moveDown(0.25);
        if (file.description) {
            params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.TEXT);
            params.doc.text(file.description);
            params.doc.moveDown(0.25);
        }
        params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
        var url = routes_1.LEARNING_OBJECT_ROUTES.GET_FILE({
            objectId: params.id,
            fileId: file.id,
            username: params.username
        }).trim();
        params.doc.text("" + url, params.doc.x, params.doc.y, {
            link: url,
            underline: true
        });
        params.doc.moveDown(0.5);
    });
    params.doc.moveDown(1);
}
/**
 * Appends header with gradient background to PDF
 *
 * @private
 * @static
 * @param {{
 *     gradientRGB: GradientVector;
 *     doc: PDFKit.PDFDocument;
 *     title: string;
 *   }} params
 * @memberof LearningObjectInteractor
 */
function appendGradientHeader(params) {
    var _a;
    var grad = (_a = params.doc).linearGradient.apply(_a, params.gradientRGB);
    grad.stop(0, PDFColors.DARK_BLUE).stop(1, PDFColors.LIGHT_BLUE);
    params.doc
        .rect(0, params.headerYStart !== undefined ? params.headerYStart : params.doc.y, 650, params.height ? params.height : 50)
        .fill(grad);
    params.doc.stroke();
    params.doc
        .fontSize(params.fontSize ? params.fontSize : PDFFontSizes.REGULAR)
        .font(PDFFonts.BOLD)
        .fillColor(PDFColors.WHITE)
        .text(params.title, params.textXStart !== undefined ? params.textXStart : params.doc.x, params.textYStart !== undefined ? params.textYStart : params.doc.y + 20, {
        align: params.align ? params.align : 'center'
    });
    params.doc.moveDown(2);
}
/**
 * Title cases string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
function titleCase(text) {
    var textArr = text.split(' ');
    for (var i = 0; i < textArr.length; i++) {
        var word = textArr[i];
        word = word.charAt(0).toUpperCase() + word.slice(1, word.length + 1);
        textArr[i] = word;
    }
    return textArr.join(' ');
}
exports.titleCase = titleCase;
