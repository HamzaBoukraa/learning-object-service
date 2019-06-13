import { LearningObject } from '../../shared/entity';
export type LearningObjectFile = LearningObject.Material.File;

/**
 * An interface representation of the FileMetadataDocument type
 *
 * @export
 * @interface FileMetadataDocument
 */
export interface FileMetadataDocument {
  /**
   * Unique identifier of the file document
   */
  id: string;
  /**
   * Time at which the file metadata was created (When the file was first ever uploaded)
   * Value is a string representing the milliseconds elapsed since the UNIX epoch
   */
  createdDate: string;
  /**
   * User supplied information about the contents of the file
   */
  description: string;
  /**
   * Server generated hash of the file's content
   */
  ETag: string;
  /**
   * Suffix identifier indicating file's type or characteristics of the file's contents
   */
  extension: string;
  /**
   * The location the file was uploaded to within the file system's hierarchy
   */
  fullPath: string;
  /**
   * Time at which the file metadata was last updated
   * Value is a string representing the milliseconds elapsed since the UNIX epoch
   */
  lastUpdatedDate: string;
  /**
   * Unique identifier of the Learning Object the file belongs to
   */
  learningObjectId: string;
  /**
   * Revision number of the Learning Object the file belongs to
   */
  learningObjectRevision: number;
  /**
   * Multipurpose Internet Mail Extensions or media type of the file
   */
  mimeType: string;
  /**
   * The name of the file
   */
  name: string;
  /**
   * Flag indicating whether or not the file can be included in the Learning Object bundle
   */
  packageable: boolean;
  /**
   * The size of the file in bytes
   */
  size: number;
  /**
   * Revision number the file copy is stored under in S3
   */
  storageRevision: number;
}
