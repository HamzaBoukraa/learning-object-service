/**
 * An interface representation of the FileMetadata type
 *
 * @export
 * @interface FileMetadata
 */
export interface FileMetadata {
  /**
   * User supplied information about the contents of the file
   */
  description?: string;
  /**
   * Server generated hash of the file's content
   */
  ETag: string;
  /**
   * The location the file was uploaded to within the Learning Object’s file system hierarchy
   */
  fullPath: string;
  /**
   * Multipurpose Internet Mail Extensions or media type of the file
   */
  mimeType: string;
  /**
   * The name of the file
   */
  name: string;
  /**
   * The size of the file in bytes
   */
  size: number;
}

/**
 * An interface representation of the FileMetadataInsert type
 *
 * @export
 * @interface FileMetadataInsert
 */
export interface FileMetadataInsert extends FileMetadata {
  /**
   * Time at which the file metadata was created (When the file was first ever uploaded)
   * Value is a string representing the milliseconds elapsed since the UNIX epoch
   */
  createdDate: string;
  /**
   * @inheritdoc
   */
  description: string;
  /**
   * Suffix identifier indicating file's type or characteristics of the file's contents
   */
  extension: string;
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
   * Flag indicating whether or not the file can be included in the Learning Object bundle
   */
  packageable: boolean;
  /**
   * Version number the file copy is stored under in S3
   * *** Example ***
   * Consider the example where we have Learning Object A with an id of exampleId and version of 1.
   * This file, File 1, was first uploaded under version 1 of Learning Object A
   * The path of File 1 in S3 might look something like `/exampleID/r1/File 1`
   * The `storageRevision` of File 1 will be `1`
   *
   * If another version of Learning Object A is made, the Learning Object's version would increment to 2
   * If this file, File 1 was not overwritten in version 2 of Learning Object A, the path of File 1 in S3 will still look something like `/exampleID/r1/File 1`
   * The `storageRevision` of File 1 will still be `1`, to point to the originally uploaded file
   *
   * If a third version of Learning Object A is made, the Learning Object's version would increment to 3
   * If this file, File 1, is overwritten in version 3 of Learning Object A, the path of File 1 in S3 will now look something like `/exampleID/r3/File 1`
   * The `storageRevision` of File 1 will now be `3`, to point to the newly uploaded file
   */
  storageRevision: number;
}

/**
 * An interface representation of the FileMetadataUpdate type
 *
 * @export
 * @interface FileMetadataUpdate
 * @extends {Partial<FileMetadataInsert>}
 */
export interface FileMetadataUpdate extends Partial<FileMetadataInsert> {}

/**
 * An interface representation of the FileMetadataDocument type
 *
 * @export
 * @interface FileMetadataDocument
 */
export interface FileMetadataDocument extends FileMetadataInsert {
  /**
   * Unique identifier of the file document
   */
  id: string;
}
