import { User, Collection } from '@cyber4all/clark-entity';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db } from 'mongodb';
import { UserDocument } from '@cyber4all/clark-schema';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import {
  Restriction,
  LearningObjectLock,
} from '@cyber4all/clark-entity/dist/learning-object';

const ERROR_MESSAGE = {
  INVALID_ACCESS: `Invalid access. User must be verified to publish Learning Objects`,
  RESTRICTED: `Unable to publish. Learning Object locked by reviewer.`,
};

export class SubmissionDatastore {
  constructor(private db: Db) { }

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
    try {
      const user = await this.fetchUser(username);

      if (!user.emailVerified) {
        return Promise.reject(ERROR_MESSAGE.INVALID_ACCESS);
      }

      const object: { lock: LearningObjectLock } = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne({ _id: id }, { projection: { _id: 0, lock: 1 } });

      // TODO: Remove check for Learning Object Lock
      if (this.objectHasRestrictions(object.lock)) {
        return Promise.reject(ERROR_MESSAGE.RESTRICTED);
      }

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
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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
          status: 'unpublished',
        },
      },
    );
  }

  /**
   * Identifies if a Learning Object has restrictions placed on it.
   *
   * @param lock the Learning Object's lock
   * @returns {boolean} whether or not there are restrictions
   */
  private objectHasRestrictions(lock: LearningObjectLock): boolean {
    return (
      lock &&
      (lock.restrictions.indexOf(Restriction.FULL) > -1 ||
        lock.restrictions.indexOf(Restriction.PUBLISH) > -1)
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
