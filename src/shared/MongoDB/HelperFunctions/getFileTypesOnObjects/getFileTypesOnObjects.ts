import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { FileMetadataInsert } from '../../../../FileMetadata/typings/index';

// All possible file extensions currently on our system
export enum EXTENSIONS {
    YOUTU = 'youtu.be',
    YOUTUBE = 'youtube',
    PPTX = 'pptx',
    PPT = 'ppt',
    DOC = 'doc',
    DOCX = 'docx',
    DOCX2 = 'DOCX',
    MP3 = 'mp3',
    MP4 = 'mp4',
    XLSX = 'xlsx',
    PNG = 'png',
    ICO = 'ico',
    SVG = 'svg',
    JPEG = 'jpeg',
    JPG = 'jpg',
    VIMEO = 'vimeo',
}

// Valid values for the fileTypes array
export enum FILETYPES {
    VIDEO = 'video',
    POWERPOINT = 'powerpoint',
    DOCUMENT = 'document',
    IMAGE = 'image',
    SPREADSHEET = 'spreadsheet',
    AUDIO = 'audio',
}

/**
 * Gets all of the files for a learning object and then returns an array of the file types that the object has.
 * @param {LearningObject} learningObject
 * @returns {Promise<string[]>}
 * @memberof MongoDriver
 */
export async function getFileTypesOnObjects(
    learningObject: LearningObject,
) {
    let fileTypes: string[] = [];
    const db = MongoConnector.client().db('file-service');

    const files = await db.collection('files').find({ learningObjectId: learningObject.id }).toArray();

    if (learningObject.materials.urls.length > 0) {
        learningObject.materials.urls.forEach(link => {
            if (link.url.includes(EXTENSIONS.YOUTU) || link.url.includes(EXTENSIONS.YOUTUBE) || link.url.includes(EXTENSIONS.VIMEO)) {
                fileTypes.push(FILETYPES.VIDEO);
            }
        });
    }

    files.forEach((file: FileMetadataInsert) => {
        switch (true) {
            case ((file.extension.includes(EXTENSIONS.PPTX) || file.extension.includes(EXTENSIONS.PPT)) && !fileTypes.includes(FILETYPES.VIDEO)):
                fileTypes.push(FILETYPES.POWERPOINT);
                break;
            case ((file.extension.includes(EXTENSIONS.DOCX) ||
                    file.extension.includes(EXTENSIONS.DOC) ||
                    file.extension.includes(EXTENSIONS.DOCX2)) &&
                    !fileTypes.includes(FILETYPES.DOCUMENT)):
                fileTypes.push(FILETYPES.DOCUMENT);
                break;
            case ((file.extension.includes(EXTENSIONS.PNG) ||
                    file.extension.includes(EXTENSIONS.ICO) ||
                    file.extension.includes(EXTENSIONS.SVG) ||
                    file.extension.includes(EXTENSIONS.JPEG) ||
                    file.extension.includes(EXTENSIONS.JPG)) &&
                    !fileTypes.includes(FILETYPES.IMAGE)):
                fileTypes.push(FILETYPES.IMAGE);
                break;
            case (file.extension.includes(EXTENSIONS.MP3) && !fileTypes.includes(FILETYPES.AUDIO)):
                fileTypes.push(FILETYPES.AUDIO);
                break;
            case ((file.extension.includes(EXTENSIONS.MP4)) && !fileTypes.includes(FILETYPES.VIDEO)):
                fileTypes.push(FILETYPES.VIDEO);
                break;
            case ((file.extension.includes(EXTENSIONS.XLSX)) && !fileTypes.includes(FILETYPES.SPREADSHEET)):
                fileTypes.push(FILETYPES.SPREADSHEET);
                break;
            default:
                break;
        }
    });

    return fileTypes;

}
