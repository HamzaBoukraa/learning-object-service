import {
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from './types';
import { UserToken } from '../shared/types';
import { sanitizeObject } from '../shared/functions';
import { LearningOutcome } from '../shared/entity';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { LearningObjectGateway } from './gateways/ModuleLearningObjectGateway';

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
  const { dataStore, user, source, outcomeInput } = params;
  let outcome: Partial<LearningOutcome>;
  try {
    outcome = new LearningOutcome(outcomeInput);
  } catch (e) {
    throw new ResourceError(
      'Bad Request',
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  return await dataStore.insertLearningOutcome({
    outcome: outcome.toPlainObject(),
    source,
  });
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

export async function getAllLearningOutcomes({
  dataStore,
  requester,
  learningObjectGateway,
  source,
}: {
  dataStore: LearningOutcomeDatastore,
  requester: UserToken,
  learningObjectGateway: LearningObjectGateway,
  source: string,
}) {
    // authorization/not-found errors are thrown in the LearningObjectAdapter and handled in the LearningOutcomeRouteHandler
    await learningObjectGateway.getLearningObject(source, requester);
    return dataStore.getAllLearningOutcomes({ source });
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
  const updates: LearningOutcomeUpdate & LearningOutcomeInsert = {
    ...sanitizeObject<LearningOutcomeUpdate>({ object: params.updates }),
    date: Date.now().toString(),
  };
  return await params.dataStore.updateLearningOutcome({
    updates,
    id: params.id,
  });
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
