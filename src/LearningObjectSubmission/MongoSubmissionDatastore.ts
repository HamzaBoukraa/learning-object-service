import {COLLECTIONS} from '../drivers/MongoDriver';
import {Db} from 'mongodb';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import {UserDocument} from '../shared/types';
import {LearningObject, User} from '../shared/entity';
import {Submission} from './types/Submission';
import {SubmissionDataStore} from './SubmissionDatastore';
import {MongoConnector} from '../shared/Mongo/MongoConnector';

export class MongoSubmissionDatastore implements SubmissionDataStore {
  db: Db;
  constructor() {
    this.db = MongoConnector.client().db();
  }

  /**
   * Store all metadata for each learning object submission in the submissions collection
   *
   * @param submission submission object to be recorded
   */
  public async recordSubmission(
    submission: Submission,
  ): Promise<void> {
    await this.db.collection(COLLECTIONS.SUBMISSIONS)
      .insertOne(
        submission,
      );
  }

  /**
   * Add cancel date property to learning object submissions that are canceled
   *
   * @param learningObjectId id of the learning object that is being moved back to unreleased
   */
  public async recordCancellation(
    learningObjectId: string,
  ): Promise<void> {
    await this.db.collection(COLLECTIONS.SUBMISSIONS)
      .findOneAndUpdate(
        { learningObjectId },
        {
          $set: { cancelDate: Date.now().toString() },
        },
        { sort: { timestamp: -1 } },
      );
  }

  /**
   * Gets the newest submission for a specified learning object
   *
   * @param learningObjectId id of the learning object to search for
   */
  public async fetchRecentSubmission(
    learningObjectId: string,
  ): Promise<Submission> {
    const submission = await this.db.collection(COLLECTIONS.SUBMISSIONS)
      .find({
        learningObjectId,
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .toArray();
    // TODO: Check for submission not found after data is backfilled
    return submission[0];
  }

  /**
   * Return the first instance of a submission with
   * specified collection name and learning object id
   *
   * @param collection name of collection to search for
   * @param learningObjectId id of the learning object to search for
   */
  public async fetchSubmission(
    collection: string,
    learningObjectId: string,
  ): Promise<Submission> {
    return await this.db.collection(COLLECTIONS.SUBMISSIONS)
        .findOne({
                   collection,
                   learningObjectId,
                 });
  }

  /**
   * @description
   * The first array index will contain a projected submission document if one
   * or more submissions exist (meaning this is not the first submission), or
   * undefined if none have been made yet.
   * The projection and limit of 1 are here to ensure the query executes quickly.
   * @inheritdoc
   */
  public async hasSubmission(learningObjectId: string, collection: string) {
    const submission = this.db.collection(COLLECTIONS.SUBMISSIONS)
      .find({ _id: learningObjectId }, { projection: { _id: 1 }})
      .limit(1)
      .toArray()[0];
    return submission !== undefined;
  }

  // TODO: Should this be an external helper?
  /**
   * Fetches a user, given their username.
   *
   * @param username of the user to be fetched
   * @returns the full user entity
   */
  async fetchUser(username: string): Promise<User> {
    const doc = await this.fetchUserDocument(username);
    return ObjectMapper.generateUser(doc);
  }

  /**
   * Fetches the document of a user from Mongo.
   *
   * @param username of the user to be fetched
   * @returns the full user document
   */
  private async fetchUserDocument(username: string): Promise<UserDocument> {
    const record = await this.db
      .collection(COLLECTIONS.USERS)
      .findOne<UserDocument>({ username });
    if (!record)
      return Promise.reject(
        'Problem fetching a user' +
          ':\n\tInvalid username ' +
          JSON.stringify(username),
      );
    return Promise.resolve(record);
  }
}
