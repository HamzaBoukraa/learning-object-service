import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { FileMetadataInsert } from '../../../../FileMetadata/typings/index';
import e = require('express');

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
            if (link.url.includes('youtu.be') || link.url.includes('youtube')) {
                fileTypes.push('video');
            }
        });
    }

    files.forEach((file: FileMetadataInsert) => {
        switch (true) {
            case ((file.extension.includes('pptx') || file.extension.includes('ppt')) && !fileTypes.includes('powerpoint')):
                fileTypes.push('powerpoint');
                break;
            case ((file.extension.includes('docx') || file.extension.includes('doc') || file.extension.includes('DOCX')) && !fileTypes.includes('document')):
                fileTypes.push('document');
                break;
            case ((file.extension.includes('PNG') || file.extension.includes('ico') || file.extension.includes('svg') || file.extension.includes('jpeg') || file.extension.includes('jpg')) && !fileTypes.includes('image')):
                fileTypes.push('image');
                break;
            case (file.extension.includes('.mp3') && !fileTypes.includes('audio')):
                fileTypes.push('audio');
                break;
            case ((file.extension.includes('.mp4')) && !fileTypes.includes('video')):
                fileTypes.push('video');
                break;
            case ((file.extension.includes('xlsx')) && !fileTypes.includes('spreadsheet')):
                fileTypes.push('spreadsheet');
                break;
            default:
                break;
        }
    });

    return fileTypes;

}
