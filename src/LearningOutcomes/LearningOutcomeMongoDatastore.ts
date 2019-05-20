import { LearningOutcomeDatastore } from './LearningOutcomeInteractor';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from './types';
import { Db, ObjectID } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { mapId } from '../drivers/Mongo/functions';
import { LearningOutcome, StandardOutcome } from '../entity';

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
    outcome: Partial<LearningOutcome>;
  }): Promise<string> {
    const id = new ObjectID().toHexString();
    params.outcome['_id'] = id;
    await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .insertOne({ ...params.outcome, source: params.source });
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
    let outcomeDoc = await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .findOne({ _id: params.id });
    if (outcomeDoc) {
      outcomeDoc.mappings = await this.getAllStandardOutcomes({
        ids: outcomeDoc.mappings,
      });
    }
    return new LearningOutcome({ id: outcomeDoc._id, ...outcomeDoc });
  }
  /**
   * Fetches Standard Outcome
   *
   * @param {{ id: string }} params
   * @returns {Promise<StandardOutcome>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async getStandardOutcome(params: { id: string }): Promise<StandardOutcome> {
    let outcome = await this.db
      .collection(COLLECTIONS.STANDARD_OUTCOMES)
      .findOne({ _id: params.id });
    return new StandardOutcome({ id: outcome._id, ...outcome });
  }

  /**
   * Fetches all Standard Outcomes in array of ids
   *
   * @param {{ id: string }} params
   * @returns {Promise<StandardOutcome[]>}
   * @memberof LearningOutcomeMongoDatastore
   */
  async getAllStandardOutcomes(params: {
    ids: string[];
  }): Promise<StandardOutcome[]> {
    let outcomes =
      params.ids && params.ids.length
        ? await this.db
            .collection(COLLECTIONS.STANDARD_OUTCOMES)
            .find({ _id: { $in: params.ids } })
            .toArray()
        : [];
    return outcomes.map(doc => new StandardOutcome({ id: doc._id, ...doc }));
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
    let outcomeDocs = await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .find({ source: params.source })
      .toArray();

    outcomeDocs = await Promise.all(
      outcomeDocs.map(async doc => {
        doc = mapId(doc);
        doc.mappings = await this.getAllStandardOutcomes({
          ids: doc.mappings,
        });
        return new LearningOutcome({ id: doc._id, ...doc });
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
