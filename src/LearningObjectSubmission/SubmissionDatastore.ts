import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db } from 'mongodb';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import { UserDocument } from '../types';
import { LearningObject, User } from '../entity';
import { Submission } from './types/Submission';
import { ResourceError, ResourceErrorReason } from '../errors';

const ERROR_MESSAGE = {
  INVALID_ACCESS: `Invalid access. User must be verified to release Learning Objects`,
  RESTRICTED: `Unable to release Learning Object. It is locked by reviewer.`,
};

export class SubmissionDatastore {
  constructor(private db: Db) {}

  /**
   * Updates a Learning Object document as having been submitted to a given collection.
   * Will not work if the user's email is not verified.
   *
   * @param username the user requesting the submission
   * @param id the identifier of the Learning Object to be submitted
   * @param collection the collection for the Learning Object to be submitted to
   */
  public async submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void> {
    await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).update(
      { _id: id },
      {
        $set: {
          published: true,
          status: 'waiting',
          collection,
        },
      },
    );
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
    const submission = await this.db.collection(COLLECTIONS.SUBMISSIONS)
      .findOne({
        collection,
        learningObjectId,
      });
    return submission;
  }

  /**
   * Removes all properties classifying a Learning Object as having
   * been submitted to a collection.
   *
   * @param id the Learning Object's identifier
   */
  public async unsubmitLearningObject(id: string): Promise<void> {
    await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).findOneAndUpdate(
      { _id: id },
      {
        $set: {
          published: false,
          status: LearningObject.Status.UNRELEASED,
        },
      },
    );
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
    const user = ObjectMapper.generateUser(doc);
    return user;
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
