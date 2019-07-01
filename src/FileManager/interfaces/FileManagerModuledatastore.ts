import {
    MultipartFileUploadStatus,
    CompletedPart,
} from '../typings/file-manager';
import { LearningObject } from '../../shared/entity';

export abstract class FileManagerModuleDatastore {

 /**
  * Inserts metadata for Multipart upload
  *
  * @abstract
  * @param {{
  *     status: MultipartFileUploadStatus;
  *   }} params
  * @returns {Promise<void>}
  * @memberof FileManagerModuleDatastore
  */
  abstract insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void>;

 /**
  * Fetches metadata for multipart upload
  *
  * @param {{
  *     id: string;
  *   }} params
  * @returns {Promise<MultipartFileUploadStatus>}
  * @memberof FileManagerModuleDatastore
  */
  abstract fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus>;

 /**
  * Updates metadata for multipart upload
  *
  * @param {{
  *     id: string;
  *     completedPart: CompletedPart;
  *   }} params
  * @returns {Promise<void>}
  * @memberof FileManagerModuleDatastore
  */
  abstract updateMultipartUploadStatus(params: {
      id: string;
      completedPart: CompletedPart
  }): Promise<void>;


  /**
   * Deletes metadata for multipart upload
   *
   * @param {{
   *     id: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof FileManagerModuleDatastore
   */
   abstract deleteMultipartUploadStatus(params: {
     id: string;
   }): Promise<void>;

}
