import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { FileMetadataInsert } from '../../../../FileMetadata/typings/index';

/**
 * Gets all of the files for a learning object and then returns an array of the file types that the object has.
 * @param {LearningObject} learningObject
 * @returns {Promise<string[]>} 
 * @memberof MongoDriver
 */
export async function getFileTypesOnObjects(
    learningObject: LearningObject
) {
    let fileTypes:string[] = [];
    const db = MongoConnector.client().db('file-service');

    const files = await db.collection('files').find({ learningObjectId: learningObject.id }).toArray();

    if (learningObject.materials.urls.length > 0) {
        learningObject.materials.urls.forEach(url => {
            if (url.url.includes('youtu.be') || url.url.includes('youtube')) {
                fileTypes.push('video');
            }
        });
    }

    files.forEach((file: FileMetadataInsert) => {
        if (file.extension.includes('pptx') || file.extension.includes('ppt')){
            if (!fileTypes.includes('powerpoint')) {
                fileTypes.push('powerpoint');
            }
        } else if (file.extension.includes('docx') || file.extension.includes('doc') || file.extension.includes('DOCX')) {
            if (!fileTypes.includes('wordDocument')) {
                fileTypes.push('wordDocument');
            }
        } else if (file.extension.includes('PNG') || file.extension.includes('ico') || file.extension.includes('svg') || file.extension.includes('jpeg') || file.extension.includes('jpg')) {
            if (!fileTypes.includes('image')) {
                fileTypes.push('image');
            }
        } else if (file.extension.includes('.mp3')) {
            if (!fileTypes.includes('audio')) {
                fileTypes.push('audio')
            }
        } else if (file.extension.includes('.mp4')) {
            if (!fileTypes.includes('video')) {
                fileTypes.push('video');
            }
        } else if (file.extension.includes('xlsx')) {
            if (!fileTypes.includes('spreadsheet')) {
                fileTypes.push('spreadsheet');
            }
        }
    })

    return fileTypes;

}