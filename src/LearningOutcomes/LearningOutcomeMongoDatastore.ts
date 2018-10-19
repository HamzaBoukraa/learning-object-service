import { LearningOutcomeDatastore } from './LearningOutcomeInteractor';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from './types';
import { LearningOutcome } from '@cyber4all/clark-entity';
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
  getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    return this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .findOne({ _id: params.id });
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
    return await this.db
      .collection<LearningOutcome>(COLLECTIONS.LEARNING_OUTCOMES)
      .find({ source: params.source })
      .toArray();
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
