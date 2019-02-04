import * as PDFKit from 'pdfkit';
import { LEARNING_OBJECT_ROUTES } from '../routes';
import { LearningObject, LearningOutcome } from '@cyber4all/clark-entity';
import { FileManager } from '../interfaces/interfaces';
import { FileUpload } from '../interfaces/FileManager';
import * as striptags from 'striptags';

type GradientVector = [number, number, number, number];
type PDFHeaderAlignment = 'left' | 'right' | 'center' | 'justify';
enum PDFFonts {
  REGULAR = 'Helvetica',
  BOLD = 'Helvetica-Bold',
}
enum PDFFontSizes {
  JUMBO = 25,
  LARGE = 20,
  MEDIUM = 18,
  REGULAR = 14.5,
}
enum PDFColors {
  TEXT = '#333',
  DARK_TEXT = '#3b3c3e',
  LINK = '#1B9CFC',
  BANNER = '#3b608b',
  WHITE = '#FFF',
  DARK_BLUE = '#2b4066',
  LIGHT_BLUE = '#3b608b',
}
enum PDFText {
  CREATOR = 'C.L.A.R.K. | Cybersecurity Labs and Resource Knowledge-base',
  COVER_PAGE_TITLE = 'CLARK | Cybersecurity Labs and Resource Knowledge-base',
  OUTCOMES_TITLE = 'Outcomes',
  DESCRIPTION_TITLE = 'Description',
  MATERIALS_TITLE = 'Content',
  UNPACKED_FILES_TITLE = 'Resources',
  UNPACKED_FILES_DESCRIPTION = 'These materials on CLARK are required to use this learning object.',
  ASSESSMENTS_TITLE = 'Assessments',
  INSTRUCTIONAL_STRATEGIES_TITLE = 'Instructional Strategies',
  URLS_TITLE = 'Links',
  NOTES_TITLE = 'Notes',
}
/**
 * Generates PDF for Learning Object
 *
 * @private
 * @static
 * @param {FileManager} fileManager
 * @param {LearningObject} learningObject
 * @memberof LearningObjectInteractor
 */
export function generatePDF(
  fileManager: FileManager,
  learningObject: LearningObject,
) {
  // Create new Doc and Track Stream
  const doc = new PDFKit();
  // Create array to catch Buffers
  const buffers: Buffer[] = [];
  // Add Event Handlers
  const pdf = addEventListeners(fileManager, doc, buffers, learningObject);
  const gradientRGB: GradientVector = [0, 0, 650, 0];
  // MetaData
  appendMetaData(doc, learningObject);
  // Cover Page
  appendGradientHeader({
    gradientRGB,
    doc,
    title: PDFText.COVER_PAGE_TITLE,
    headerYStart: 0,
    textXStart: 100,
    textYStart: 22,
  });
  appendCoverPage(doc, learningObject);
  doc.addPage();
  // Description TEMP REMOVAL
  if (learningObject.description) {
    appendGradientHeader({
      gradientRGB,
      doc,
      title: PDFText.DESCRIPTION_TITLE,
      headerYStart: doc.y - 75,
      textYStart: doc.y - 70 + 20,
    });
    appendDescription(doc, learningObject.description);
  }
  // Outcomes
  if (learningObject.outcomes.length) {
    appendGradientHeader({
      gradientRGB,
      doc,
      title: PDFText.OUTCOMES_TITLE,
      headerYStart: doc.y - 75,
      textYStart: doc.y - 70 + 20,
    });
    appendOutcomes(doc, learningObject);
  }
  // Content (Urls)
  if (learningObject.materials.urls.length || learningObject.materials.notes) {
    appendGradientHeader({
      gradientRGB,
      doc,
      title: PDFText.MATERIALS_TITLE,
    });
    appendTextMaterials(doc, learningObject);
  }
  // Unpacked Files
  const unpackedFiles = learningObject.materials.files.filter(
    f => !f['packageable'],
  );
  if (unpackedFiles.length) {
    appendGradientHeader({
      gradientRGB,
      doc,
      title: PDFText.UNPACKED_FILES_TITLE,
    });
    appendUnpackedFileURLs({
      doc,
      files: <LearningObject.Material.File[]>unpackedFiles,
      id: learningObject.id,
      username: learningObject.author.username,
    });
  }
  doc.end();
  return pdf;
}

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
function addEventListeners(
  fileManager: FileManager,
  doc: PDFKit.PDFDocument,
  buffers: Buffer[],
  learningObject: LearningObject,
): Promise<LearningObject.Material.PDF> {
  doc.on('data', (data: Buffer) => {
    buffers.push(data);
  });
  doc.on('error', e => {
    console.log(e);
  });

  return new Promise<LearningObject.Material.PDF>(resolve => {
    doc.on('end', async () => {
      const buffer: Buffer = Buffer.concat(buffers);
      const fileName = `0ReadMeFirst - ${learningObject.name}.pdf`;
      const path = `${learningObject.author.username}/${
        learningObject.id
      }/${fileName}`;
      const fileUpload: FileUpload = {
        path,
        data: buffer,
      };
      const url = await fileManager.upload({ file: fileUpload });
      resolve({
        url,
        name: fileName,
      });
    });
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
function appendMetaData(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
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
function appendCoverPage(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
  doc.moveDown(8);
  doc
    .fontSize(PDFFontSizes.JUMBO)
    .fillColor(PDFColors.TEXT)
    .text(learningObject.name, { align: 'center' });
  doc.moveDown(2);
  doc.font(PDFFonts.REGULAR);
  doc.fontSize(PDFFontSizes.LARGE).text(learningObject.length.toUpperCase(), {
    align: 'center',
  });
  doc.moveDown(2);
  const authorName = titleCase(learningObject.author.name);
  doc.fontSize(PDFFontSizes.MEDIUM).text(
    `${authorName} - ${new Date(+learningObject.date).toLocaleDateString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    )}`,
    { align: 'center' },
  );
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
function appendDescription(doc: PDFKit.PDFDocument, description: string) {
  doc
    .fillColor(PDFColors.TEXT)
    .fontSize(PDFFontSizes.REGULAR)
    .font(PDFFonts.REGULAR);
  // Strip html tags from rich text
  const text = striptags(description);
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
function appendOutcomes(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
  learningObject.outcomes.forEach(outcome => {
    appendOutcomeHeader(doc, outcome);
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
function appendOutcomeHeader(
  doc: PDFKit.PDFDocument,
  outcome: LearningOutcome,
) {
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
  doc.text(
    `Students will be able to ${outcome.verb.toLowerCase()} ${outcome.text}`,
  );
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
function appendTextMaterials(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
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
function appendMaterialURLs(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
  doc
    .fillColor(PDFColors.BANNER)
    .fontSize(PDFFontSizes.REGULAR)
    .font(PDFFonts.BOLD);
  doc.text(PDFText.URLS_TITLE);
  doc.moveDown(0.5);
  learningObject.materials.urls.forEach(url => {
    doc.fillColor(PDFColors.DARK_TEXT);
    doc.text(url.title);
    doc.moveDown(0.25);
    doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
    doc.text(`${url.url}`, doc.x, doc.y, {
      link: url.url,
      underline: true,
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
function appendMaterialNotes(
  doc: PDFKit.PDFDocument,
  learningObject: LearningObject,
) {
  doc
    .fillColor(PDFColors.BANNER)
    .fontSize(PDFFontSizes.REGULAR)
    .font(PDFFonts.BOLD);
  doc.text(PDFText.NOTES_TITLE);
  doc.moveDown(0.5);
  doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
  // Print lines with individual api calls to avoid malformed
  const lines = learningObject.materials.notes
    .split(/\n/g)
    .filter(line => line);
  for (const line of lines) {
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
 * @param {files} LearningObject.Material.File[]
 * @memberof LearningObjectInteractor
 */
function appendUnpackedFileURLs(params: {
  doc: PDFKit.PDFDocument;
  files: LearningObject.Material.File[];
  id: string;
  username: string;
}) {
  params.doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
  params.doc.text(PDFText.UNPACKED_FILES_DESCRIPTION, { align: 'center' });
  params.doc.moveDown(2);
  params.files.forEach(file => {
    params.doc.fillColor(PDFColors.DARK_TEXT);
    params.doc.text(file.name);
    params.doc.moveDown(0.25);

    if (file.description) {
      params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.TEXT);
      params.doc.text(file.description);
      params.doc.moveDown(0.25);
    }

    params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
    const url = LEARNING_OBJECT_ROUTES.GET_FILE({
      objectId: params.id,
      fileId: file.id,
      username: params.username,
    }).trim();
    params.doc.text(`${url}`, params.doc.x, params.doc.y, {
      link: url,
      underline: true,
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
function appendGradientHeader(params: {
  gradientRGB: GradientVector;
  doc: PDFKit.PDFDocument;
  title: string;
  align?: PDFHeaderAlignment;
  fontSize?: number;
  height?: number;
  headerYStart?: number;
  textYStart?: number;
  textXStart?: number;
}) {
  // @ts-ignore gradientRGB is guaranteed to match params required in linearGradient call signature
  const grad = params.doc.linearGradient(...params.gradientRGB);
  grad.stop(0, PDFColors.DARK_BLUE).stop(1, PDFColors.LIGHT_BLUE);
  params.doc
    .rect(
      0,
      params.headerYStart !== undefined ? params.headerYStart : params.doc.y,
      650,
      params.height ? params.height : 50,
    )
    .fill(grad);
  params.doc.stroke();
  params.doc
    .fontSize(params.fontSize ? params.fontSize : PDFFontSizes.REGULAR)
    .font(PDFFonts.BOLD)
    .fillColor(PDFColors.WHITE)
    .text(
      params.title,
      params.textXStart !== undefined ? params.textXStart : params.doc.x,
      params.textYStart !== undefined ? params.textYStart : params.doc.y + 20,
      {
        align: params.align ? params.align : 'center',
      },
    );
  params.doc.moveDown(2);
}

/**
 * Title cases string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
export function titleCase(text: string): string {
  const textArr = text.split(' ');
  for (let i = 0; i < textArr.length; i++) {
    let word = textArr[i];
    word = word.charAt(0).toUpperCase() + word.slice(1, word.length + 1);
    textArr[i] = word;
  }
  return textArr.join(' ');
}
