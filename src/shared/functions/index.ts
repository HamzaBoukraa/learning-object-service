import { LearningObject, User } from '../entity';
import { LearningObjectSummary, AuthorSummary } from '../types';
import { isEmail } from './isEmail/isEmail';
import { sanitizeRegex } from './sanitizeRegex/sanitizeRegex';
export { isEmail, sanitizeRegex };

/**
 * Formats text properly for usage in DataStore
 *
 * @export
 * @param {string} text
 * @param {boolean} [lowerCase=true]
 * @returns {string}
 */
export function sanitizeText(text: string, lowerCase = true): string {
  let clean = text;
  if (clean) {
    if (lowerCase) {
      clean = clean.toLowerCase();
    }
    clean = clean.trim();
  }

  return clean;
}

/**
 * Sanitizes Object by removing undefined values and lower-casing strings;
 *
 * @export
 * @param {T} object
 * @returns {T}
 */
export function sanitizeObject<T>(
  params: { object: T },
  lowercaseStrings = true,
): T {
  const keys = Object.keys(params.object);
  for (const key of keys) {
    const field = params.object[key];
    if (!field || field == null || field === 'undefined' || field === 'null') {
      delete params.object[key];
    } else if (field && typeof field === 'string') {
      params.object[key] = sanitizeText(field, lowercaseStrings);
    }
  }
  return params.object;
}

/**
 * Returns new array with element(s) from value param or null if value was not defined
 *
 * @template T
 * @param {*} value
 * @returns {T[]}
 */
export function toArray<T>(value: any): T[] {
  if (value == null || value === '') {
    return null;
  }
  if (value && Array.isArray(value)) {
    return [...value].filter(v => !isEmptyValue(v));
  }
  return [value].filter(v => !isEmptyValue(v));
}

/**
 * Checks if provided value is null or an empty string
 *
 * @param {*} value [The value being checked]
 * @returns {boolean}
 */
function isEmptyValue(value: any): boolean {
  if (value == null || value === '') {
    return true;
  }
  if (typeof value === 'string') {
    return sanitizeText(value) === '';
  }
  return false;
}

/**
 *
 * Converts non-number value to number if defined else returns null
 * @param {*} value
 * @returns {number}
 */
export function toNumber(value: any): number {
  const num = parseInt(`${value}`, 10);
  if (!isNaN(num)) {
    return num;
  }
  return null;
}

/**
 *
 * Converts value to boolean if not yet a boolean
 * @param {*} value
 * @returns {boolean}
 */
export function toBoolean(value: any): boolean {
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  return false;
}

/**
 * Converts LearningObject type into LearningObjectSummary
 *
 * @private
 * @param {Partial<LearningObject>} object [The document data to convert to AuthorSummary]
 * @returns {LearningObjectSummary}
 */
export function mapLearningObjectToSummary(
  object: Partial<LearningObject>,
): LearningObjectSummary {
  return {
    id: object.id,
    cuid: object.cuid,
    author: mapAuthorToSummary(object.author),
    collection: object.collection,
    contributors: object.contributors
      ? object.contributors.map(mapAuthorToSummary)
      : [],
    date: object.date,
    description: object.description,
    revisionUri: object.revisionUri || null,
    length: object.length,
    levels: object.levels,
    name: object.name,
    version: object.version,
    status: object.status,
    resourceUris: object.resourceUris,
  };
}

/**
 * Converts  User type into AuthorSummary
 *
 * @private
 * @param {Partial<User>} author [The document data to convert to AuthorSummary]
 * @returns {AuthorSummary}
 */
export function mapAuthorToSummary(author: Partial<User>): AuthorSummary {
  return {
    id: author.id,
    username: author.username,
    name: author.name,
    email: author.email,
    organization: author.organization,
  };
}

/**
 * Capitalizes the first letter of each word in the provided string.
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

/**
 * Replaces invalid file path characters in a Learning Object's name with _ characters
 *
 * @param {string} path
 * @returns {string}
 */
export function sanitizeLearningObjectName(path: string): string {
  return path.replace(/[\\/:"*?<>|]/gi, '_');
}
