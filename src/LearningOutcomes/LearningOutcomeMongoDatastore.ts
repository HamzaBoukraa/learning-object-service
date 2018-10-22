import { LearningOutcomeDatastore } from './LearningOutcomeInteractor';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from './types';
import { LearningOutcome, StandardOutcome } from '@cyber4all/clark-entity';
import { Db, ObjectID } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';

export class LearningOutcomeMongoDatastore implements LearningOutcomeDatastore {
  constructor(private db: Db) {}

  /**
   * Inserts Learning Outcome
   *
   * @param {({
   *     source: string;
   *     outcome: LearningOutcomeInput & LearningOutcomeInsert;
   *   })} params
   * @returns {Promise<string>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async insertLearningOutcome(params: {
    source: string;
    outcome: LearningOutcomeInput & LearningOutcomeInsert;
  }): Promise<string> {
    const id = new ObjectID().toHexString();
    params.outcome['_id'] = id;
    await this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .insertOne(params.outcome);
    return id;
  }

  /**
   * Fetches Learning Outcome
   *
   * @param {{ id: string }} params
   * @returns {Promise<LearningOutcome>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    const outcomeDoc = await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .findOne({ _id: params.id });
    if (outcomeDoc) {
      outcomeDoc.mappings = await this.getAllStandardOutcomes({
        ids: outcomeDoc.mappings,
      });
    }
    return outcomeDoc;
  }
  /**
   * Fetches Standard Outcome
   *
   * @param {{ id: string }} params
   * @returns {Promise<StandardOutcome>}
   * @memberof LearningOutcomeMongoDatastore
   */
  getStandardOutcome(params: { id: string }): Promise<StandardOutcome> {
    return this.db
      .collection<StandardOutcome>(COLLECTIONS.STANDARD_OUTCOMES)
      .findOne({ _id: params.id });
  }

  /**
   * Fetches all Standard Outcomes in array of ids
   *
   * @param {{ id: string }} params
   * @returns {Promise<StandardOutcome[]>}
   * @memberof LearningOutcomeMongoDatastore
   */
  getAllStandardOutcomes(params: {
    ids: string[];
  }): Promise<StandardOutcome[]> {
    return this.db
      .collection<StandardOutcome>(COLLECTIONS.STANDARD_OUTCOMES)
      .find({ _id: { $in: params.ids } })
      .toArray();
  }

  /**
   * Fetches all Learning Outcomes for source Learning Object
   *
   * @param {{
   *     source: string;
   *   }} params
   * @returns {Promise<LearningOutcome[]>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]> {
    const outcomeDocs = await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .find({ source: params.source })
      .toArray();

    await Promise.all(
      outcomeDocs.map(async doc => {
        doc.mappings = await this.getAllStandardOutcomes({
          ids: doc.mappings,
        });
      }),
    );

    return outcomeDocs;
  }

  /**
   * Updates properties in Learning Outcome
   *
   * @param {({
   *     id: string;
   *     updates: LearningOutcomeUpdate & LearningOutcomeInsert;
   *   })} params
   * @returns {Promise<LearningOutcome>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome> {
    await this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .updateOne({ _id: params.id }, { $set: params.updates });
    return this.getLearningOutcome({ id: params.id });
  }

  /**
   * Deletes Learning Outcome
   *
   * @param {{ id: string }} params
   * @returns {Promise<void>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async deleteLearningOutcome(params: { id: string }): Promise<void> {
    await this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .deleteOne({ _id: params.id });
  }

  /**
   * Deletes all Learning Outcomes for source Learning Object
   *
   * @param {{ source: string }} params
   * @returns {Promise<void>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async deleteAllLearningOutcomes(params: { source: string }): Promise<void> {
    await this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .deleteMany({ source: params.source });
  }
}
