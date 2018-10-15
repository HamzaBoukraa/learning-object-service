import { User, Collection } from '@cyber4all/clark-entity';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db } from 'mongodb';
import { UserDocument } from '@cyber4all/clark-schema';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import { Restriction, LearningObjectLock } from '@cyber4all/clark-entity/dist/learning-object';

const ERROR_MESSAGE = {
  INVALID_ACCESS: `Invalid access. User must be verified to publish Learning Objects`,
  RESTRICTED: `Unable to publish. Learning Object locked by reviewer.`,
};

export class SubmissionDatastore {

  constructor(private db: Db) { }

  public async togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const user = await this.fetchUser(username);

      // check if user is verified and if user is attempting to publish. If not verified and attempting to publish reject
      if (!user.emailVerified && published)
        return Promise.reject(ERROR_MESSAGE.INVALID_ACCESS);
      // else
      const object: { lock: LearningObjectLock } = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne({ _id: id }, { _id: 0, lock: 1 });
      if (this.objectHasRestrictions(object.lock)) {
        return Promise.reject(ERROR_MESSAGE.RESTRICTED);
      }
      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .update(
          { _id: id },
          { $set: { published: published, status: published ? 'waiting' : 'unpublished' } },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  private objectHasRestrictions(lock: LearningObjectLock) {
    return lock &&
      (lock.restrictions.indexOf(Restriction.FULL) > -1 ||
      lock.restrictions.indexOf(Restriction.PUBLISH) > -1);
  }
  // TODO: Should this be an external helper?
  async fetchUser(username: string): Promise<User> {
    const doc = await this.fetchUserDocument(COLLECTIONS.User, username);
    const user = ObjectMapper.generateUser(doc);
    return user;
  }
  private async fetchUserDocument(collection: Collection, username: string): Promise<UserDocument> {
    const record = await this.db
      .collection(collection.name)
      .findOne<UserDocument>({ username });
    if (!record)
      return Promise.reject(
        'Problem fetching a ' +
        collection.name +
        ':\n\tInvalid username ' +
        JSON.stringify(username),
      );
    return Promise.resolve(record);
  }
}
