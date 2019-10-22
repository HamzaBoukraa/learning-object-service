import { LearningObject } from '../learning-object/learning-object';
/**
 * Provide abstract representation of a libraryItem
 */

export interface LibraryItem {
    // Date item was added to library or last downloaded
    savedOn: number;
    // ID of the user that saved the object to their library
    savedBy: string;
    // Learning Object that was saved
    learningObject: LearningObject;
    // Optional boolean to determine if the object has been downloaded
    downloaded?: boolean;
}