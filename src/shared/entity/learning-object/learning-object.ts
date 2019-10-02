/**
 * Provide abstract representations for learning objects.
 */

import { User } from '../user/user';
import { LearningOutcome } from '../learning-outcome/learning-outcome';
import { LEARNING_OBJECT_ERRORS } from './error-messages';
import { EntityError } from '../errors/entity-error';
import { LearningObjectSummary } from '../../types';
import * as uuid from 'uuid/v4';

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 170;

export type LearningObjectResourceUris = {
  outcomes?: string;
  children?: string;
  materials?: string;
  metrics?: string;
  parents?: string;
  ratings?: string;
};

/**
 * A class to represent a learning object.
 * @class
 */
export class LearningObject {
  private _id: string;
  get id(): string {
    return this._id;
  }
  set id(id: string) {
    if (!this.id) {
      this._id = id;
    } else {
      throw new EntityError(LEARNING_OBJECT_ERRORS.ID_SET, 'id');
    }
  }

  private _cuid?: string;

  /**
   * A CLARK Universal Identifier.
   *
   * The CUID property maintains the relationship between released Learning Objects and their working copies. Since each are separate documents, they mmust
   * have a unique _id property that can be used as a foreign key, but can share a CUID.
   *
   * @private
   * @type {string}
   * @memberof LearningObject
   */
  get cuid(): string {
    return this._cuid;
  }

  /**
   * Set the CUID property. Will throw an instance of EntityError if the CUID property is already set.
   *
   * @memberof LearningObject
   */
  set cuid(cuid: string) {
    if (!this._cuid) {
      this._cuid = cuid;
    } else {
      throw new EntityError(LEARNING_OBJECT_ERRORS.CUID_SET, 'cuid');
    }
  }

  generateCUID(): void {
    this.cuid = uuid();
  }

  private _author: User;
  /**
   * @property {User} author (immutable)
   *       the user this learning object belongs to
   */
  get author(): User {
    return this._author;
  }

  private _name!: string;
  /**
   * @property {string} name
   *       the object's identifying name, unique over a user
   *
   */
  get name(): string {
    return this._name;
  }

  set name(name: string) {
    if (this.isValidName(name)) {
      this._name = name.trim();
    } else {
      throw new EntityError(LEARNING_OBJECT_ERRORS.INVALID_NAME, 'name');
    }
  }

  /**
   * Checks if name is valid
   *
   * @private
   * @param {string} name
   * @returns {boolean}
   * @memberof LearningObject
   */
  private isValidName(name: string): boolean {
    if (name !== undefined && name !== null) {
      const trimmedName = name.trim();
      if (
        trimmedName.length < MIN_NAME_LENGTH ||
        trimmedName.length > MAX_NAME_LENGTH
      ) {
        return false;
      }
      return true;
    }
    return false;
  }

  private _description!: string;
  /**
   * @property {string} description
   *       description of the object's content
   *
   */
  get description(): string {
    return this._description;
  }
  set description(description: string) {
    if (description !== undefined && description !== null) {
      this._description = description.trim();
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_DESCRIPTION,
        'description',
      );
    }
  }

  private _date: string;
  /**
   * @property {string} date
   *       the object's last-modified date
   */
  get date(): string {
    return this._date;
  }

  private _length!: LearningObject.Length;
  /**
   * @property {string} length
   *       the object's class, determining its length (eg. module)
   *       values are restricted according to available lengths
   */
  get length(): LearningObject.Length {
    return this._length;
  }

  set length(length: LearningObject.Length) {
    if (this.isValidLength(length)) {
      this._length = length;
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_LENGTH(length),
        'length',
      );
    }
  }

  /**
   * Validates length
   *
   * @private
   * @param {LearningObject.Length} length
   * @returns {boolean}
   * @memberof LearningObject
   */
  private isValidLength(length: LearningObject.Length): boolean {
    const validLengths: LearningObject.Length[] = Object.keys(
      LearningObject.Length,
    ).map(
      // @ts-ignore Keys are not numbers and element is of type Length
      (key: string) => LearningObject.Length[key] as LearningObject.Length,
    );
    if (validLengths.includes(length)) {
      return true;
    }
    return false;
  }

  private _levels: LearningObject.Level[];
  /**
   * @property {string[]} levels
   *       this object's Academic Level. (ie K-12)
   */
  get levels(): LearningObject.Level[] {
    return this._levels;
  }

  /**
   * Adds new LearningObject.Level to array of levels if level is not present in this object's levels
   *
   * @memberof LearningObject
   */
  addLevel(level: LearningObject.Level) {
    const [alreadyAdded, isValid] = this.isValidLevel(level);
    if (!alreadyAdded && isValid) {
      this._levels.push(level);
    } else if (alreadyAdded) {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.LEVEL_EXISTS(level),
        'level',
      );
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_LEVEL(level),
        'level',
      );
    }
  }

  /**
   * Removes level from this object's levels
   *
   * @param {level} LearningObject.Level
   * @memberof LearningObject
   */
  removeLevel(level: LearningObject.Level): void {
    const index = this.levels.indexOf(level);
    if (this.levels.length > 1 && index > -1) {
      // tslint:disable-next-line:no-unused-expression
      this._levels.splice(index, 1)[0];
    } else {
      throw new EntityError(
        index <= -1
          ? LEARNING_OBJECT_ERRORS.LEVEL_DOES_NOT_EXIST(level)
          : LEARNING_OBJECT_ERRORS.INVALID_LEVELS,
        'level',
      );
    }
  }

  /**
   * Validates level and checks if level has already been added
   *
   * @private
   * @param {LearningObject.Level} level
   * @returns {boolean}
   * @memberof LearningObject
   */
  private isValidLevel(level: LearningObject.Level): boolean[] {
    const validLevels: LearningObject.Level[] = Object.keys(
      LearningObject.Level,
    ).map(
      // @ts-ignore Keys are not numbers and element is of type LearningObject.Level
      (key: string) => LearningObject.Level[key] as LearningObject.Level,
    );
    const alreadyAdded = this.levels.includes(level);
    const isValid = validLevels.includes(level);
    if (!alreadyAdded && isValid) {
      return [alreadyAdded, isValid];
    }
    return [alreadyAdded, isValid];
  }

  private _outcomes: LearningOutcome[];
  /**
   * @property {LearningOutcome[]} outcomes
   *       outcomes this object should enable students to achieve
   *
   */
  get outcomes(): LearningOutcome[] {
    return this._outcomes;
  }
  /**
   * Adds a passed outcome or new, blank learning outcome to this object.
   * @returns {number} index of the outcome
   */
  addOutcome(outcome?: LearningOutcome): number {
    const addingOutcome =
      outcome instanceof LearningOutcome
        ? outcome
        : new LearningOutcome(outcome);

    return this._outcomes.push(addingOutcome) - 1;
  }
  /**
   * Removes the object's i-th learning outcome.
   * @param {number} index the index to remove from this objects' outcomes
   *
   * @returns {LearningOutcome} the learning outcome which was removed
   */
  removeOutcome(index: number): LearningOutcome {
    return this._outcomes.splice(index, 1)[0];
  }

  private _materials!: LearningObject.Material;
  /**
   * @property {LearningObject.Material} materials neutrino file/url storage
   *
   */
  get materials(): LearningObject.Material {
    return this._materials;
  }
  set materials(material: LearningObject.Material) {
    if (material) {
      this._materials = material;
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_MATERIAL,
        'materials',
      );
    }
  }

  private _metrics!: LearningObject.Metrics;
  /**
   * @property {LearningObject.Metrics} metrics neutrino file/url storage
   *
   */
  get metrics(): LearningObject.Metrics {
    return this._metrics;
  }
  set metrics(metrics: LearningObject.Metrics) {
    if (metrics) {
      this._metrics = metrics;
    } else {
      throw new EntityError(LEARNING_OBJECT_ERRORS.INVALID_METRICS, 'metrics');
    }
  }

  children: LearningObjectSummary[] = [];

  /**
   * Removes the object's i-th child.
   * @param {number} index the index to remove from this objects' children
   *
   * @returns {LearningObjectChildSummary} the child object which was removed
   */
  removeChild(index: number): LearningObjectSummary {
    return this.children.splice(index, 1)[0];
  }

  private _contributors: User[];
  /**
   * @property {contributors} User[] array of Users
   *
   */
  get contributors(): User[] {
    return this._contributors;
  }

  /**
   * Adds User to this object's contributors
   *
   * @param {User} contributor
   * @returns {number} index of the contributor
   * @memberof LearningObject
   */
  addContributor(contributor: User): number {
    if (contributor) {
      const addingUser =
        contributor instanceof User ? contributor : new User(contributor);

      return this._contributors.push(addingUser) - 1;
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_CONTRIBUTOR,
        'contributors',
      );
    }
  }
  /**
   * Removes the object's i-th contributor.
   * @param {number} index the index to remove from this object's contributors
   *
   * @returns {User} the user object which was removed
   */
  removeContributor(index: number): User {
    return this._contributors.splice(index, 1)[0];
  }

  private _collection!: string;
  /**
   * @property {collection} string the collection this object belongs to
   *
   */
  get collection(): string {
    return this._collection;
  }
  set collection(collection: string) {
    if (collection !== undefined && collection !== null) {
      this._collection = collection;
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_COLLECTION,
        'collection',
      );
    }
  }

  private _status!: LearningObject.Status;
  /**
   * @property {status} Status Represents current state of Learning Object
   *
   */
  get status(): LearningObject.Status {
    return this._status;
  }
  set status(status: LearningObject.Status) {
    // FIXME: Remove when system has removed old valid status values
    status = this.remapStatus(status);
    if (this.isValidStatus(status)) {
      this._status = status;
    } else {
      throw new EntityError(
        LEARNING_OBJECT_ERRORS.INVALID_STATUS(status),
        'status',
      );
    }
  }
  /**
   * @property {boolean} hasRevision
   * An optional field on a learning object, denoting whether or not the object
   * has a working copy with a different status in the working collection.
   */
  private _hasRevision?: boolean;

  get hasRevision(): boolean {
    return this._hasRevision;
  }

  private _version!: number;
  /**
   * @property {string} version The version number of the Learning Object
   *
   */
  get version(): number {
    return this._version;
  }
  set version(version: number) {
    this._version = version;
  }

  /**
   * Store's URI's to additional pieces of the Learning Object to be fetched asynchronously
   *
   * @memberof LearningObject
   */
  resourceUris?: LearningObjectResourceUris;

  /**
   * Attach URIs of additional resources to the Learning Object
   *
   * @param {string} resourceUriHost the base URI of the api
   * @memberof LearningObject
   */
  attachResourceUris(resourceUriHost: string) {
    // attach additional properties
    if (!this.resourceUris) {
      this.resourceUris = {};
    }

    this.resourceUris.outcomes = `${resourceUriHost}/users/${this.author.username}/learning-objects/${this.id}/outcomes`;

    this.resourceUris.children = `${resourceUriHost}/users/${this.author.username}/learning-objects/${this.id}/children`;

    // tslint:disable-next-line: max-line-length
    this.resourceUris.materials = `${resourceUriHost}/users/${this.author.username}/learning-objects/${this.id}/materials?status=${this.status !== LearningObject.Status.RELEASED ? LearningObject.Status.UNRELEASED : ''}`;

    this.resourceUris.metrics = `${resourceUriHost}/users/${this.author.username}/learning-objects/${this.id}/metrics`;

    this.resourceUris.parents = `${resourceUriHost}/learning-objects/${this.id}/parents`;

    this.resourceUris.ratings = `${resourceUriHost}/users/${this.author.username}/learning-objects/${this.cuid}/version/${this.revision}/ratings`;
  }

  /**
   * Map deprecated status values to new LearningObject.Status values
   *
   * @private
   * @param {string} status
   * @returns {LearningObject.Status}
   * @memberof LearningObject
   */
  private remapStatus(status: string): LearningObject.Status {
    switch (status) {
      case 'published':
        return LearningObject.Status.RELEASED;
      case 'unpublished':
        return LearningObject.Status.UNRELEASED;
      default:
        return status as LearningObject.Status;
    }
  }

  /**
   * Validates status passed is a valid status
   *
   * @private
   * @param {LearningObject.Status} status
   * @returns {boolean}
   * @memberof LearningObject
   */
  private isValidStatus(status: LearningObject.Status): boolean {
    const validStatuses: LearningObject.Status[] = Object.keys(
      LearningObject.Status,
    ).map(
      // @ts-ignore Keys are not numbers and element is of type Status
      (key: string) => LearningObject.Status[key] as LearningObject.Status,
    );
    if (validStatuses.includes(status)) {
      return true;
    }
    return false;
  }

  private _constructed = false;

  /**
   * Creates an instance of LearningObject.
   * @param {Partial<LearningObject>} [object]
   * @memberof LearningObject
   */
  constructor(object?: Partial<LearningObject> | any) {
    // @ts-ignore Id will be undefined on creation
    this._id = undefined;
    this._cuid = undefined;
    this._author = new User();
    this._name = '';
    this._description = '';
    this._date = Date.now().toString();
    this._length = LearningObject.Length.NANOMODULE;
    this._levels = [LearningObject.Level.Undergraduate];
    this._outcomes = [];
    this._materials = {
      files: [],
      urls: [],
      notes: '',
      folderDescriptions: [],
      pdf: { name: '' },
    };
    this._contributors = [];
    this._collection = '';
    this._status = LearningObject.Status.UNRELEASED;
    this._metrics = { saves: 0, downloads: 0 };
    this._version = 0;
    if (object) {
      this.copyObject(object);
    }
    this._constructed = true;
  }

  /**
   * Copies properties of object to this learning object if defined
   *
   * @private
   * @param {Partial<LearningObject>} object
   * @memberof LearningObject
   */
  private copyObject(object: Partial<LearningObject> | any): void {
    if (object.id) {
      this.id = object.id;
    }

    if (object.cuid) {
      this.cuid = object.cuid;
    }

    if (object.author) {
      this._author = new User(object.author);
    }
    if (object.name !== undefined) {
      this.name = object.name;
    }
    if (object.description) {
      this.description = object.description;
    }
    if (object.date) {
      this._date = object.date;
    }
    this.length = <LearningObject.Length>object.length || this.length;
    if (object.levels) {
      this._levels = [];
      (<LearningObject.Level[]>object.levels).map(level =>
        this.addLevel(level),
      );
    }
    if (object.outcomes) {
      (<LearningOutcome[]>object.outcomes).map(outcome =>
        this.addOutcome(outcome),
      );
    }
    this.materials =
      <LearningObject.Material>object.materials || this.materials;
    if (Array.isArray(object.children)) {
      this.children = object.children;
    }
    if (object.contributors) {
      (<User[]>object.contributors).map(contributor =>
        this.addContributor(contributor),
      );
    }
    if (object.hasRevision === true) {
      this._hasRevision = object.hasRevision;
    }
    if (object.version != null) {
      this.version = object.version;
    }
    this.collection = <string>object.collection || this.collection;
    this.status = <LearningObject.Status>object.status || this.status;
    this.metrics = <LearningObject.Metrics>object.metrics || this.metrics;
  }

  /**
   * Converts LearningObject to plain object without functions and private properties
   *
   * @returns {Partial<LearningObject>}
   * @memberof LearningObject
   */
  public toPlainObject(): Partial<LearningObject> {
    const object: Partial<LearningObject> = {
      id: this.id,
      cuid: this.cuid,
      author: this.author.toPlainObject() as User,
      name: this.name,
      description: this.description,
      date: this.date,
      length: this.length,
      levels: this.levels,
      outcomes: this.outcomes.map(
        outcome => outcome.toPlainObject() as LearningOutcome,
      ),
      materials: this.materials,
      contributors: this.contributors.map(
        contributor => contributor.toPlainObject() as User,
      ),
      children: this.children,
      collection: this.collection,
      status: this.status,
      metrics: this.metrics,
      hasRevision: this.hasRevision,
      version: this.version,
      resourceUris: this.resourceUris,
    };
    return object;
  }

  public toSummary(): LearningObjectSummary {
    // FIXME: This is gross and wrong
    const summary = { ...this.toPlainObject() };
    delete summary.outcomes;
    delete summary.materials;
    return summary as LearningObjectSummary;
  }
}

export namespace LearningObject {
  export enum Length {
    NANOMODULE = 'nanomodule',
    MICROMODULE = 'micromodule',
    MODULE = 'module',
    UNIT = 'unit',
    COURSE = 'course',
  }

  export enum Status {
    REJECTED = 'rejected',
    UNRELEASED = 'unreleased',
    WAITING = 'waiting',
    REVIEW = 'review',
    PROOFING = 'proofing',
    RELEASED = 'released',
  }

  export enum Level {
    Elementary = 'elementary',
    Middle = 'middle',
    High = 'high',
    Undergraduate = 'undergraduate',
    Graduate = 'graduate',
    PostGraduate = 'post graduate',
    CC = 'community college',
    Training = 'training',
  }

  export enum Restriction {
    FULL = 'full',
    PUBLISH = 'publish',
    DOWNLOAD = 'download',
  }

  export interface Lock {
    date?: string;
    restrictions: Restriction[];
  }

  export interface Metrics {
    saves: number;
    downloads: number;
  }
  export interface Material {
    files: LearningObject.Material.File[];
    urls: LearningObject.Material.Url[];
    notes: string;
    folderDescriptions: LearningObject.Material.FolderDescription[];
    pdf: LearningObject.Material.PDF;
  }

  export namespace Material {
    export interface File {
      id: string;
      name: string;
      fileType: string;
      extension: string;
      previewUrl?: string;
      date: string;
      fullPath?: string;
      size?: number;
      description?: string;
      packageable?: boolean;
      storageRevision: number;
    }
    export interface Url {
      title: string;
      url: string;
    }

    export interface FolderDescription {
      path: string;
      description: string;
    }
    export interface PDF {
      name: string;
    }
  }
}
