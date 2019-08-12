import { levels, taxonomy } from '@cyber4all/clark-taxonomy';
import { LearningOutcome } from '../learning-outcome';
import {
  LEARNING_OUTCOME_ERROR_MESSAGES,
  SUBMITTABLE_LEARNING_OUTCOME_ERROR_MESSAGES,
} from './error-messages';
import { StandardOutcome } from '../../standard-outcome/standard-outcome';

/**
 * Validates object is LearningOutcome
 *
 * @export
 * @param {LearningOutcome} outcome
 * @returns {(void | never)}
 */
export function validate(outcome: LearningOutcome): void | never {
  validateBloom(outcome.bloom);
  validateMappings(outcome.mappings);
  validateText(outcome.text);
  validateVerb(outcome.bloom, outcome.verb);
}

/**
 * Validates object is a submittable LearningOutcome
 *
 * @export
 * @param {LearningOutcome} outcome
 * @returns {(void | never)}
 */
export function validateSubmittableLearningOutcome(
  outcome: LearningOutcome,
): void | never {
  validate(outcome);
  validateSubmittableText(outcome.text);
}

/**
 * Validates bloom property
 *
 * @param {string} bloom
 * @returns {(void | never)}
 */
function validateBloom(bloom: string): void | never {
  if (!bloom || (bloom && levels.includes(bloom.toLowerCase()))) {
    throw new Error(LEARNING_OUTCOME_ERROR_MESSAGES.INVALID_BLOOM(bloom));
  }
}

/**
 * Validates mappings property
 *
 * @param {StandardOutcome[]} mappings
 * @returns {(void | never)}
 */
function validateMappings(mappings: StandardOutcome[]): void | never {
  if (!mappings) {
    throw new Error(LEARNING_OUTCOME_ERROR_MESSAGES.INVALID_MAPPINGS);
  }
}

/**
 * Validates text property
 *
 * @param {string} text
 * @returns {(void | never)}
 */
function validateText(text: string): void | never {
  if (text == null) {
    throw new Error(LEARNING_OUTCOME_ERROR_MESSAGES.INVALID_TEXT);
  }
}

/**
 * Validates text property is submittable
 *
 * @param {string} text
 * @returns {(void | never)}
 */
function validateSubmittableText(text: string): void | never {
  if (text == null || (text && !text.trim())) {
    throw new Error(SUBMITTABLE_LEARNING_OUTCOME_ERROR_MESSAGES.INVALID_TEXT);
  }
}

/**
 * Validates verb property
 *
 * @param {string} bloom
 * @param {string} verb
 * @returns {(void | never)}
 */
function validateVerb(bloom: string, verb: string): void | never {
  if (
    !verb ||
    (verb &&
      (taxonomy.taxons[bloom] as { verbs: string[] }).verbs.includes(
        verb.toLowerCase(),
      ))
  ) {
    throw new Error(LEARNING_OUTCOME_ERROR_MESSAGES.INVALID_VERB(bloom, verb));
  }
}
