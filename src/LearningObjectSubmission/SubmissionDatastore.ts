import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db } from 'mongodb';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import { UserDocument } from '../types';
import { LearningObject, User } from '../entity';
import { Submission } from './types/Submission';

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

  public async recordSubmission(params: {
    submission: Submission,
  }): Promise<void> {
    await this.db.collection(COLLECTIONS.SUBMISSIONS)
      .insertOne({
        submission: params.submission,
      });
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
