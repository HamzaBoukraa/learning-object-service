import { DataStore, FileManager } from '../interfaces/interfaces';
import { LearningObject, LearningOutcome } from '@cyber4all/clark-entity';
import * as PDFKit from 'pdfkit';
import * as stopword from 'stopword';
import * as striptags from 'striptags';
import * as stemmer from 'stemmer';
import { LearningObjectQuery } from '../interfaces/DataStore';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { CartInteractor } from './CartInteractor';
import { File } from '@cyber4all/clark-entity/dist/learning-object';
export type LearningObjectFile = File;
export type GradientVector = [number, number, number, number];
export class LearningObjectInteractor {
  /**
   * Load the scalar fields of a user's objects (ignore goals and outcomes).
   * @async
   *
   * @param {string} userid the user's login id
   *
   * @returns {User}
   */
  public static async loadLearningObjectSummary(
    dataStore: DataStore,
    username: string,
    accessUnpublished?: boolean,
    loadChildren?: boolean,
    query?: LearningObjectQuery,
  ): Promise<LearningObject[]> {
    try {
      let total = 0;
      let summary: LearningObject[] = [];
      if (
        query &&
        (query.name ||
          query.length ||
          query.level ||
          query.standardOutcomeIDs ||
          query.text)
      ) {
        const response = await this.searchObjects(
          dataStore,
          query.name,
          username,
          query.length,
          query.level,
          query.standardOutcomeIDs,
          query.text,
          accessUnpublished,
          query.orderBy,
          query.sortType,
          query.page,
          query.limit,
        );
        summary = response.objects;
        total = response.total;
      } else {
        const objectIDs = await dataStore.getUserObjects(username);
        summary = await dataStore.fetchMultipleObjects(
          objectIDs,
          false,
          accessUnpublished,
          query ? query.orderBy : null,
          query ? query.sortType : null,
        );
        total = summary.length;
      }

      if (loadChildren) {
        summary = await Promise.all(
          summary.map(async object => {
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                dataStore,
                object,
                false,
                accessUnpublished,
              );
            }
            return object;
          }),
        );
      }

      summary = await Promise.all(
        summary.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return summary;
    } catch (e) {
      return Promise.reject(`Problem loading summary. Error: ${e}`);
    }
  }

  /**
   * Load a learning object and all its learning outcomes.
   * @async
   *
   * @param {UserID} author the author's database id
   * @param {string} name the learning object's identifying string
   *
   * @returns {LearningObject}
   */
  public static async loadLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    try {
      const fullChildren = false;
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        true,
        accessUnpublished,
      );
      learningObject.id = learningObjectID;

      if (learningObject.children) {
        learningObject.children = await this.loadChildObjects(
          dataStore,
          learningObject,
          fullChildren,
          accessUnpublished,
        );
      }

      try {
        learningObject.metrics = await this.loadMetrics(learningObjectID);
      } catch (e) {
        console.log(e);
      }

      return learningObject;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private static async loadChildObjects(
    dataStore: DataStore,
    learningObject: LearningObject,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject[]> {
    if (learningObject.children) {
      let children = await dataStore.fetchMultipleObjects(
        <string[]>learningObject.children,
        full,
        accessUnpublished,
      );

      children = await Promise.all(
        children.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      for (let child of children) {
        child.children = await this.loadChildObjects(
          dataStore,
          child,
          full,
          accessUnpublished,
        );
      }
      return [...children];
    }
    return null;
  }

  public static async loadFullLearningObjectByIDs(
    dataStore: DataStore,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(ids, true);

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem loading full LearningObject by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Add a new learning object to the database.
   * NOTE: this function only adds basic fields;
   *       the user.outcomes field is ignored
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {UserID} author - database id of the parent
   * @param {LearningObject} object - entity to add
   *
   * @returns {LearningObjectID} the database id of the new record
   */
  public static async addLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    object: LearningObject,
  ): Promise<LearningObject> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      } else {
        const learningObjectID = await dataStore.insertLearningObject(object);
        object.id = learningObjectID;
        this.generatePDF(fileManager, object);
        return object;
      }
    } catch (e) {
      // The duplicate key error is produced by Mongo, via a constraint on the authorID/name compound index
      // FIXME: This should be an error that is encapsulated within the MongoDriver, since it is specific to Mongo's indexing functionality
      if (/duplicate key error/gi.test(e)) {
        return Promise.reject(
          `Could not save Learning Object. Learning Object with name: ${
            object.name
          } already exists.`,
        );
      }
      return Promise.reject(`Problem creating Learning Object. Error${e}`);
    }
  }

  private static validateLearningObject(object: LearningObject): string {
    let error = null;
    if (object.name.trim() === '') {
      error = 'Learning Object name cannot be empty.';
    } else if (object.published && !object.outcomes.length) {
      error = 'Learning Object must have outcomes to publish.';
    } else if (object.published && !object.goals[0].text) {
      error = 'Learning Object must have a description to publish.';
    }
    return error;
  }
  /**
   * Upload Materials and sends back array of LearningObject Materials
   *
   * @static
   * @param {FileManager} fileManager
   * @param {Responder} responder
   * @param {string} id
   * @param {string} username
   * @param {any[]} files
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async uploadMaterials(
    fileManager: FileManager,
    id: string,
    username: string,
    files: any[],
    filePathMap: Map<string, string>,
  ): Promise<any> {
    try {
      const learningObjectFiles: LearningObjectFile[] = [];
      await Promise.all(
        files.map(async file => {
          const loFile = this.generateLearningObjectFile(file);
          const parent = filePathMap.get(loFile.id);
          const path = this.getFullPath(filePathMap, loFile);
          const uploadPath = `${username}/${id}/${path}`;
          loFile.url = await fileManager.upload(
            uploadPath,
            file.buffer.length ? file.buffer : Buffer.from(file.buffer),
          );
          if (parent) {
            loFile.fullPath = path;
          }
          learningObjectFiles.push(loFile);
        }),
      );
      return learningObjectFiles;
    } catch (e) {
      return Promise.reject(`Problem uploading materials. Error: ${e}`);
    }
  }

  /**
   * Deletes specified file
   *
   * @static
   * @param {FileManager} fileManager
   * @param {Responder} responder
   * @param {string} id
   * @param {string} username
   * @param {string} filename
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async deleteFile(
    fileManager: FileManager,
    id: string,
    username: string,
    filename: string,
  ): Promise<void> {
    try {
      const path = `${username}/${id}/${filename}`;
      return fileManager.delete(path);
    } catch (e) {
      return Promise.reject(`Problem deleting file. Error: ${e}`);
    }
  }

  /**
   * Look up a learning outcome by its source and tag.
   * @async
   *
   * @param {LearningObjectID} source the object source's unique database id
   * @param {number} tag the outcome's unique identifier
   *
   * @returns {LearningOutcomeID}
   */
  public static async findLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
  ): Promise<string> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      return learningObjectID;
    } catch (e) {
      return Promise.reject(`Problem finding LearningObject. Error: ${e}`);
    }
  }

  /**
   * Update an existing learning object record.
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {LearningObjectID} id - database id of the record to change
   * @param {LearningObject} object - entity with values to update to
   */
  public static async updateLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    id: string,
    object: LearningObject,
  ): Promise<void> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      } else {
        this.generatePDF(fileManager, object);
        return dataStore.editLearningObject(id, object);
      }
    } catch (e) {
      return Promise.reject(`Problem updating Learning Object. Error: ${e}`);
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const object = await dataStore.fetchLearningObject(id, true, true);
      published ? object.publish() : object.unpublish();
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      }
      return dataStore.togglePublished(username, id, published);
    } catch (e) {
      return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectName: string,
  ): Promise<void> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        false,
        true,
      );
      await dataStore.deleteLearningObject(learningObjectID);
      if (learningObject.materials.files.length) {
        const path = `${learningObjectID}/${username}/`;
        await fileManager.deleteAll(path);
      }
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Object. Error: ${error}`,
      );
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectNames: string[],
  ): Promise<void> {
    try {
      const learningObjectsWithFiles: LearningObject[] = [];
      const learningObjectIDs: string[] = [];
      for (let name of learningObjectNames) {
        const id = await dataStore.findLearningObject(username, name);
        learningObjectIDs.push(id);
        const object = await dataStore.fetchLearningObject(id, false, true);
        object.id = id;
        if (object.materials.files.length) {
          learningObjectsWithFiles.push(object);
        }
      }
      await dataStore.deleteMultipleLearningObjects(learningObjectIDs);

      for (let object of learningObjectsWithFiles) {
        const path = `${object.id}/${username}/`;
        await fileManager.deleteAll(path);
      }
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Objects. Error: ${error}`,
      );
    }
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {LearningObject[]} array of literally all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    currPage: number,
    limit: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const accessUnpublished = false;
      const response = await dataStore.fetchAllObjects(
        accessUnpublished,
        currPage,
        limit,
      );
      response.objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return response;
    } catch (e) {
      return Promise.reject(
        `Problem fetching all Learning Objects. Error: ${e}`,
      );
    }
  }

  /**
   * TODO: Refactor into fetchAllObjects. DRY
   * Returns array of learning objects associated with the given ids.
   * @returns {LearningObjectRecord[]}
   */
  public static async fetchMultipleObjects(
    dataStore: DataStore,
    ids: { username: string; learningObjectName: string }[],
  ): Promise<LearningObject[]> {
    try {
      // Get IDs associated with LearningObjects
      const learningObjectIDs = await Promise.all(
        ids.map(id => {
          return new Promise<string>((resolve, reject) => {
            dataStore
              .findLearningObject(id.username, id.learningObjectName)
              .then(
                learningObjectID => resolve(learningObjectID),
                err => reject(err),
              );
          });
        }),
      );

      let learningObjects: LearningObject[] = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
        false,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching multiple Learning Objects. Error: ${e}`,
      );
    }
  }

  public static async fetchObjectsByIDs(
    dataStore: DataStore,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(
        ids,
        true,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Search for objects by name, author, length, level, and content.
   *
   * @param {string} name the objects' names should closely relate
   * @param {string} author the objects' authors' names` should closely relate
   * @param {string} length the objects' lengths should match exactly
   * @param {string} level the objects' levels should match exactly TODO: implement
   * @param {boolean} ascending whether or not result should be in ascending order
   *
   * @returns {Outcome[]} list of outcome suggestions, ordered by score
   */
  public static async searchObjects(
    dataStore: DataStore,
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number,
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      if (text) {
        const firstChar = text.charAt(0);
        const lastChar = text.charAt(text.length - 1);
        if (firstChar !== `"` && lastChar !== `"`) {
          text = this.removeStopwords(text);
          text = this.stemWords(text);
        }
      }
      const response = await dataStore.searchObjects(
        name,
        author,
        length,
        level,
        standardOutcomeIDs,
        text,
        accessUnpublished,
        orderBy,
        sortType,
        currPage,
        limit,
      );

      response.objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return response;
    } catch (e) {
      return Promise.reject(`Problem suggesting Learning Objects. Error:${e}`);
    }
  }

  public static async fetchCollections(
    dataStore: DataStore,
    loadObjects?: boolean,
  ): Promise<any> {
    try {
      const collections = await dataStore.fetchCollections(loadObjects);
      return collections;
    } catch (e) {
      return Promise.reject(`Problem fetching collections. Error: ${e}`);
    }
  }

  public static async fetchCollection(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const collection = await dataStore.fetchCollection(name);
      return collection;
    } catch (e) {
      return Promise.reject(`Problem fetching collection. Error: ${e}`);
    }
  }

  public static async fetchCollectionMeta(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const collectionMeta = await dataStore.fetchCollectionMeta(name);
      return collectionMeta;
    } catch (e) {
      return Promise.reject(
        `Problem fetching collection metadata. Error: ${e}`,
      );
    }
  }

  public static async fetchCollectionObjects(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const objects = await dataStore.fetchCollectionObjects(name);
      return objects;
    } catch (e) {
      return Promise.reject(`Problem fetching collection objects. Error: ${e}`);
    }
  }

  public static async addChild(params: {
    dataStore: DataStore;
    childId: string;
    username: string;
    parentName: string;
  }): Promise<void> {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      return params.dataStore.insertChild(parentID, params.childId);
    } catch (e) {
      return Promise.reject(`Problem adding child. Error: ${e}`);
    }
  }

  public static async removeChild(params: {
    dataStore: DataStore;
    childId: string;
    username: string;
    parentName: string;
  }) {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      return params.dataStore.deleteChild(parentID, params.childId);
    } catch (e) {
      return Promise.reject(`Problem removing child. Error: ${e}`);
    }
  }
  /**
   * Fetches Metrics for Learning Object
   *
   * @private
   * @static
   * @param {string} objectID
   * @returns {Promise<Metrics>}
   * @memberof LearningObjectInteractor
   */
  private static async loadMetrics(objectID: string): Promise<Metrics> {
    try {
      return CartInteractor.getMetrics(objectID);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Returns stems for words in a string
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static stemWords(text: string): string {
    text = text
      .split(' ')
      .map(word => stemmer(word))
      .join(' ')
      .trim();
    return text;
  }

  /**
   * Returns string without stopwords
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static removeStopwords(text: string): string {
    const oldString = text.split(' ');
    text = stopword
      .removeStopwords(oldString)
      .join(' ')
      .trim();
    return text;
  }

  /**
   * Generates new LearningObjectFile Object
   *
   * @private
   * @param {any} file
   * @returns
   * @memberof S3Driver
   */
  private static generateLearningObjectFile(file: any): LearningObjectFile {
    const name_id = file.originalname.split(/!@!/g);
    const originalname = name_id[0];
    const id = name_id[1];
    const fileType = file.mimetype;
    const extMatch = originalname.match(/(\.[^.]*$|$)/);
    const extension = extMatch ? extMatch[0] : '';
    const date = Date.now().toString();

    const learningObjectFile: LearningObjectFile = {
      id: id,
      name: originalname,
      fileType: fileType,
      extension: extension,
      url: null,
      date: date,
    };

    return learningObjectFile;
  }

  /**
   * Gets file's full path
   *
   * @private
   * @param {Map<string, string>} filePathMap
   * @param {LearningObjectFile} file
   * @returns
   * @memberof S3Driver
   */
  private static getFullPath(
    filePathMap: Map<string, string>,
    file: LearningObjectFile,
  ) {
    let folderName = filePathMap.get(file.id);
    if (!folderName) {
      return file.name;
    }
    let path = `${folderName}/${file.name}`;
    return path;
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
  private static generatePDF(
    fileManager: FileManager,
    learningObject: LearningObject,
  ) {
    // Create new Doc and Track Stream
    const doc = new PDFKit();
    // Create array to catch Buffers
    const buffers: Buffer[] = [];
    // Add Event Handlers
    this.addEventListeners(fileManager, doc, buffers, learningObject);
    const gradientRGB: GradientVector = [0, 0, 650, 0];
    // MetaData
    this.appendMetaData(doc, learningObject);
    // Cover Page
    this.appendCoverPage(gradientRGB, doc, learningObject);
    doc.addPage();
    // Goals
    if (learningObject.goals.length) {
      this.appendLearningGoals(gradientRGB, doc, learningObject);
    }
    // Outcomes
    if (learningObject.outcomes.length) {
      this.appendOutcomes(gradientRGB, doc, learningObject);
    }
    // Content (Urls)
    if (
      learningObject.materials.urls.length ||
      learningObject.materials.notes
    ) {
      this.appendTextMaterials(gradientRGB, doc, learningObject);
    }
    doc.end();
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
  private static addEventListeners(
    fileManager: FileManager,
    doc: PDFKit.PDFDocument,
    buffers: Buffer[],
    learningObject: LearningObject,
  ) {
    doc.on('data', (data: Buffer) => {
      buffers.push(data);
    });
    doc.on('error', e => {
      console.log(e);
    });
    doc.on('end', () => {
      const buffer: Buffer = Buffer.concat(buffers);
      const path = `${learningObject.author.username}/${
        learningObject.name
      }/0ReadMeFirst - ${learningObject.name}.pdf`;
      return fileManager.upload(path, buffer);
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
  private static appendMetaData(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc.info.Title = learningObject.name;
    doc.info.Author = learningObject.author.name;
    doc.info.Creator =
      'C.L.A.R.K. | Cybersecurity Labs and Resource Knowledge-base';
    doc.info.CreationDate = new Date(+learningObject.date);
    doc.info.ModDate = new Date();
  }

  /**
   * Adds Cover Page to PDF Document
   *
   * @private
   * @static
   * @param {number[]} gradientRGB
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendCoverPage(
    gradientRGB: GradientVector,
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    // @ts-ignore GradientVector is an array of length 4
    const grad: PDFKit.PDFLinearGradient = doc.linearGradient(...gradientRGB);
    grad.stop(0, '#2b4066').stop(1, '#3b608b');
    doc.rect(0, 0, 650, 50).fill(grad);
    doc.stroke();
    doc
      .fontSize(14.5)
      .font('Helvetica-Bold')
      .fillColor('#FFF')
      .text('CLARK | Cybersecurity Labs and Resource Knowledge-base', 100, 22, {
        align: 'center',
      });
    doc.moveDown(10);
    doc
      .fontSize(25)
      .fillColor('#333')
      .text(learningObject.name, { align: 'center' });
    doc.moveDown(2);
    doc.font('Helvetica');
    doc.fontSize(20).text(learningObject.length.toUpperCase(), {
      align: 'center',
    });
    doc.moveDown(2);
    const authorName = titleCase(learningObject.author.name);
    doc.fontSize(18).text(
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
  private static appendLearningGoals(
    gradientRGB: GradientVector,
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    // @ts-ignore GradientVector is an array of length 4
    const grad: PDFKit.PDFLinearGradient = doc.linearGradient(...gradientRGB);
    grad.stop(0, '#2b4066').stop(1, '#3b608b');
    doc.rect(0, doc.y - 75, 650, 50).fill(grad);
    doc.stroke();
    doc
      .fontSize(14.5)
      .font('Helvetica-Bold')
      .fillColor('#FFF')
      .text('Description', doc.x, doc.y - 70 + 20, { align: 'center' });
    doc.moveDown(2);
    doc
      .fillColor('#333')
      .fontSize(14.5)
      .font('Helvetica');
    // Only get first goal for 'description'
    const goal = learningObject.goals[0];
    // Strip html tags from rich text
    const text = striptags(goal.text);
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
  private static appendOutcomes(
    gradientRGB: GradientVector,
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    // @ts-ignore GradientVector is an array of length 4
    const grad = doc.linearGradient(...gradientRGB);
    grad.stop(0, '#2b4066').stop(1, '#3b608b');
    doc.rect(0, doc.y, 650, 50).fill(grad);
    doc.stroke();
    doc
      .fontSize(14.5)
      .font('Helvetica-Bold')
      .fillColor('#FFF')
      .text('Outcomes', doc.x, doc.y + 20, { align: 'center' });
    doc.moveDown(2);
    learningObject.outcomes.forEach(outcome => {
      this.appendOutcomeHeader(doc, outcome);
      // Assessments
      if (outcome.assessments.length) {
        this.appendOutcomeAssessments(doc, outcome);
      }
      // Instructional Strategies
      if (outcome.strategies.length) {
        this.appendOutcomeStrategies(doc, outcome);
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
  private static appendOutcomeHeader(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor('#3b608b')
      .fontSize(14.5)
      .font('Helvetica-Bold');
    doc.text(outcome.bloom);
    doc.moveDown(0.5);
    doc
      .fontSize(14.5)
      .font('Helvetica')
      .fillColor('#333');
    doc.text(
      `Students will be able to ${outcome.verb.toLowerCase()} ${outcome.text}`,
    );
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
  private static appendOutcomeAssessments(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor('#3b608b')
      .fontSize(14.5)
      .font('Helvetica-Bold');
    doc.text('Assessments');
    doc.moveDown(0.5);
    outcome.assessments.forEach(assessment => {
      doc.fillColor('#333');
      doc.text(assessment.plan);
      doc.moveDown(0.5);
      doc.font('Helvetica');
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
  private static appendOutcomeStrategies(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor('#3b608b')
      .fontSize(14.5)
      .font('Helvetica-Bold');
    doc.text('Instructional Strategies');
    doc.moveDown(0.5);
    outcome.strategies.forEach(strategy => {
      doc.fillColor('#333');
      doc.text(strategy.plan);
      doc.moveDown(0.5);
      doc.font('Helvetica');
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
  private static appendTextMaterials(
    gradientRGB: GradientVector,
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    // @ts-ignore GradientVector is an array of length 4
    const grad = doc.linearGradient(...gradientRGB);
    grad.stop(0, '#2b4066').stop(1, '#3b608b');
    doc.rect(0, doc.y, 650, 50).fill(grad);
    doc.stroke();
    doc
      .fontSize(14.5)
      .font('Helvetica-Bold')
      .fillColor('#FFF')
      .text('Content', doc.x, doc.y + 20, { align: 'center' });
    doc.moveDown(2);
    // Content (URLs)
    if (learningObject.materials.urls.length) {
      this.appendMaterialURLs(doc, learningObject);
    }
    // Content (Notes)
    if (learningObject.materials.notes) {
      this.appendMaterialNotes(doc, learningObject);
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
  private static appendMaterialURLs(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc
      .fillColor('#3b608b')
      .fontSize(14.5)
      .font('Helvetica-Bold');
    doc.text('Links');
    doc.moveDown(0.5);
    learningObject.materials.urls.forEach(url => {
      doc.fillColor('#3b3c3e');
      doc.text(url.title);
      doc.moveDown(0.25);
      doc.font('Helvetica').fillColor('#1B9CFC');
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
  private static appendMaterialNotes(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc
      .fillColor('#3b608b')
      .fontSize(14.5)
      .font('Helvetica-Bold');
    doc.text('Notes');
    doc.moveDown(0.5);
    doc.fillColor('#333').font('Helvetica');
    doc.text(learningObject.materials.notes);
  }
}
export function titleCase(text: string): string {
  const textArr = text.split(' ');
  for (let i = 0; i < textArr.length; i++) {
    let word = textArr[i];
    word = word.charAt(0).toUpperCase() + word.slice(1, word.length + 1);
    textArr[i] = word;
  }
  return textArr.join(' ');
}
const MAX_CHAR = 250;
export function sanitizeFileName(name: string): string {
  let clean = name.replace(/[\\/:"*?<>|]/gi, '_');
  if (clean.length > MAX_CHAR) {
    clean = clean.slice(0, MAX_CHAR);
  }
  return clean;
}
