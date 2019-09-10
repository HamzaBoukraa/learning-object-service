import { LearningObject } from '../learning-object';
import {
  LEARNING_OBJECT_ERRORS,
  SUBMITTABLE_LEARNING_OBJECT_ERRORS,
} from './error-messages';
import { LearningOutcome } from '../../learning-outcome/learning-outcome';
import { User } from '../../user/user';
import {
  LearningObjectMetadataUpdates,
  AuthorSummary,
  LearningObjectSummary,
} from '../../../types';
import { ResourceError, ResourceErrorReason } from '../../../errors';

/**
 * Validates object is a valid Learning Object
 *
 * @export
 * @param {LearningObject} object
 * @returns {(void | never)}
 */
export function validateLearningObject(object: LearningObject): void | never {
  if (!object) {
    throw new Error(LEARNING_OBJECT_ERRORS.INVALID_OBJECT);
  }
  if (object.children) {
    validateChildren(object.children);
  }
  validateCollection(object.collection);
  if (object.contributors) {
    validateContributors(object.contributors);
  }
  validateDescription(object.description);
  validateLength(object.length);
  validateLevels(object.levels);
  validateMaterials(object.materials);
  validateMetrics(object.metrics);
  validateName(object.name);
  validateSubmittableOutcomes(object.outcomes);
  validateStatus(object.status);
}

export function validateUpdates(object: LearningObjectMetadataUpdates) {
  if (!object) {
    throw new Error(LEARNING_OBJECT_ERRORS.INVALID_OBJECT);
  } else {
    if (object.name) {
      validateName(object.name);
    }
    if (object.description) {
      validateDescription(object.description);
    }
    if (object.length) {
      validateLength(object.length);
    }
    if (object.status) {
      validateStatus(object.status);
    }
  }
}

/**
 * Validates object is a submittable Learning Object
 *
 * @export
 * @param {LearningObject} object
 * @returns {(void | never)}
 */
export function validateSubmittableLearningObject(
  object: LearningObject,
): void | never {
  validateLearningObject(object);
  validateSubmittableDescription(object.description);
  validateSubmittableOutcomes(object.outcomes);
}

/**
 * Validate child objects
 *
 * @param {LearningObject[]} children
 * @returns {(void | never)}
 */
function validateChildren(children: LearningObjectSummary[]): void | never {
  if (!children) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_CHILDREN,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  children.forEach(validateLearningObject);
}

/**
 * Validates collection property
 *
 * @param {string} collection
 * @returns {(void | never)}
 */
function validateCollection(collection: string): void | never {
  if (collection == null) {
    throw new Error(LEARNING_OBJECT_ERRORS.INVALID_COLLECTION);
  }
}

/**
 * Validates contributors property
 *
 * @param {User[]} contributors
 * @returns {(void | never)}
 */
function validateContributors(
  contributors: User[] | AuthorSummary[],
): void | never {
  if (!contributors) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_CONTRIBUTORS,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates description property
 *
 * @param {string} description
 * @returns {(void | never)}
 */
function validateDescription(description: string): void | never {
  if (description == null) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_DESCRIPTION,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates description property is submittable
 *
 * @param {string} description
 * @returns {(void | never)}
 */
function validateSubmittableDescription(description: string): void | never {
  if (!description || (description && !description.trim())) {
    throw new ResourceError(
      SUBMITTABLE_LEARNING_OBJECT_ERRORS.INVALID_DESCRIPTION,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates length property
 *
 * @param {string} length
 */
function validateLength(length: string): void | never {
  if (!isValidLength(length)) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_LENGTH(length),
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates length
 *
 * @private
 * @param {LearningObject.Length} length
 * @returns {boolean}
 *
 */
function isValidLength(length: string): boolean {
  const validLengths: LearningObject.Length[] = Object.keys(
    LearningObject.Length,
  ).map(
    // @ts-ignore Keys are not numbers and element is of type Length
    (key: string) => LearningObject.Length[key] as LearningObject.Length,
  );
  if (validLengths.includes(length as LearningObject.Length)) {
    return true;
  }
  return false;
}

/**
 * Validates level property
 *
 * @param {string[]} levels
 * @returns {(void | never)}
 */
function validateLevels(levels: string[]): void | never {
  if (!levels || !(levels && levels.length)) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_LEVELS,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  levels.forEach((level: LearningObject.Level) => {
    const [alreadyAdded, isValid] = isValidLevel(
      level,
      levels as LearningObject.Level[],
    );
    if (alreadyAdded) {
      throw new ResourceError(
        LEARNING_OBJECT_ERRORS.INVALID_LEVEL(level),
        ResourceErrorReason.BAD_REQUEST,
      );
    }
    if (!isValid) {
      throw new ResourceError(
        LEARNING_OBJECT_ERRORS.INVALID_LEVEL(level),
        ResourceErrorReason.BAD_REQUEST,
      );
    }
  });
}

/**
 * Validates level and checks if level has already been added
 *
 * @private
 * @param {LearningObject.Level} level
 * @returns {boolean}
 *
 */
function isValidLevel(
  level: LearningObject.Level,
  levels: LearningObject.Level[],
): boolean[] {
  const validLevels: LearningObject.Level[] = Object.keys(
    LearningObject.Level,
  ).map(
    // @ts-ignore Keys are not numbers and element is of type LearningObject.Level
    (key: string) => LearningObject.Level[key] as LearningObject.Level,
  );
  const alreadyAdded = levels.includes(level);
  const isValid = validLevels.includes(level);
  return [alreadyAdded, isValid];
}

/**
 * Validates materials
 *
 * @param {LearningObject.Material} material
 * @returns {(void | never)}
 */
function validateMaterials(material: LearningObject.Material): void | never {
  if (!material) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_MATERIAL,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates metrics
 *
 * @param {LearningObject.Metrics} metrics
 */
function validateMetrics(metrics: LearningObject.Metrics): void | never {
  if (!metrics) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_METRICS,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates name property
 *
 * @param {string} name
 * @returns {(void | never)}
 */
function validateName(name: string): void | never {
  if (!isValidName(name)) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_NAME,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 170;
/**
 * Checks if name is valid
 *
 * @private
 * @param {string} name
 * @returns {boolean}
 *
 */
function isValidName(name: string): boolean {
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

/**
 * Validates outcomes
 *
 * @param {LearningOutcome[]} outcomes
 * @returns {(void | never)}
 */
function validateLearningOutcome(outcomes: LearningOutcome[]): void | never {
  if (!outcomes) {
    throw new Error(LEARNING_OBJECT_ERRORS.INVALID_OUTCOMES);
  }
  outcomes.forEach(o => {
    LearningOutcome.validate(o);
  });
}

/**
 * Validates outcomes are submittable
 *
 * @param {LearningOutcome[]} outcomes
 * @returns {(void | never)}
 */
function validateSubmittableOutcomes(
  outcomes: LearningOutcome[],
): void | never {
  if (!outcomes || (outcomes && !outcomes.length)) {
    throw new ResourceError(
      SUBMITTABLE_LEARNING_OBJECT_ERRORS.INVALID_OUTCOMES,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  outcomes.forEach(o => {
    LearningOutcome.validateSubmittable(o);
  });
}

/**
 * Validates status property
 *
 * @param {string} status
 * @returns {(void | never)}
 */
function validateStatus(status: string): void | never {
  if (!isValidStatus(status as LearningObject.Status)) {
    throw new ResourceError(
      LEARNING_OBJECT_ERRORS.INVALID_STATUS(status),
      ResourceErrorReason.BAD_REQUEST,
    );
  }
}

/**
 * Validates status passed is a valid status
 *
 * @private
 * @param {LearningObject.Status} status
 * @returns {boolean}
 */
function isValidStatus(status: LearningObject.Status): boolean {
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
