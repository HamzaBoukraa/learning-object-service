import { LearningOutcome } from '@cyber4all/clark-entity';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from './types';
import { UserToken } from '../types';
import { sanitizeObject } from '../functions';

export interface LearningOutcomeDatastore {
  insertLearningOutcome(params: {
    source: string;
    outcome: Partial<LearningOutcome>;
  }): Promise<string>;
  getLearningOutcome(params: { id: string }): Promise<LearningOutcome>;
  getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]>;
  updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome>;
  deleteLearningOutcome(params: { id: string }): Promise<void>;
  deleteAllLearningOutcomes(params: { source: string }): Promise<void>;
}

/**
 * Inserts LearningOutcome
 *
 * @export
 * @param {{
 *   dataStore: LearningOutcomeDatastore;
 *   source: string;
 *   outcomeInput: LearningOutcomeInput;
 * }} params
 * @returns {Promise<string>}
 */
export async function addLearningOutcome(params: {
  dataStore: LearningOutcomeDatastore;
  user: UserToken;
  source: string;
  outcomeInput: Partial<LearningOutcome>;
}): Promise<string> {
  try {
    //FIXME: add authorization
    const { dataStore, user, source, outcomeInput } = params;
    const outcome = new LearningOutcome(outcomeInput);
    return await dataStore.insertLearningOutcome({
      outcome: outcome.toPlainObject(),
      source,
    });
  } catch (e) {
    return Promise.reject(`Problem adding learning outcome. ${e}`);
  }
}

/**
 * Fetches LearningOutcome by Id
 *
 * @export
 * @param {{
 *   dataStore: LearningOutcomeDatastore;
 *   id: string;
 * }} params
 * @returns {Promise<LearningOutcome>}
 */
export async function getLearningOutcome(params: {
  dataStore: LearningOutcomeDatastore;
  user: UserToken;
  id: string;
}): Promise<LearningOutcome> {
  try {
    return await params.dataStore.getLearningOutcome({ id: params.id });
  } catch (e) {
    return Promise.reject(`Problem getting outcome: ${params.id}. ${e}`);
  }
}

/**
 * Updates LearningOutcome
 *
 * @export
 * @param {{
 *   dataStore: LearningOutcomeDatastore;
 *   id: string;
 *   updates: LearningOutcomeUpdate;
 * }} params
 * @returns {Promise<LearningOutcome>}
 */
export async function updateLearningOutcome(params: {
  dataStore: LearningOutcomeDatastore;
  user: UserToken;
  id: string;
  updates: LearningOutcomeUpdate;
}): Promise<LearningOutcome> {
  try {
    const updates: LearningOutcomeUpdate & LearningOutcomeInsert = {
      ...sanitizeObject<LearningOutcomeUpdate>({ object: params.updates }),
      date: Date.now().toString(),
    };
    return await params.dataStore.updateLearningOutcome({
      updates,
      id: params.id,
    });
  } catch (e) {
    return Promise.reject(
      `Problem updating learning outcome: ${params.id}. ${e}`,
    );
  }
}

/**
 * Deletes LearningOutcome
 *
 * @export
 * @param {{
 *   dataStore: LearningOutcomeDatastore;
 *   id: string;
 * }} params
 * @returns {Promise<void>}
 */
export async function deleteLearningOutcome(params: {
  dataStore: LearningOutcomeDatastore;
  user: UserToken;
  id: string;
}): Promise<void> {
  try {
    return await params.dataStore.deleteLearningOutcome({
      id: params.id,
    });
  } catch (e) {
    return Promise.reject(
      `Problem deleting learning outcome: ${params.id}. ${e}`,
    );
  }
}

export function authorizeLearningOutcomeOperation() {
  // Some Auth Here
}
