import { User, Collection, LearningOutcome } from '@cyber4all/clark-entity';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db, ObjectId } from 'mongodb';
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

  public async createChangelog (
    learningObjectId: String,
    userId: String,
    changelogText: String
  ):Promise<void> {
    try {
      // Check if the specified learning object already has existing changelogs
      const record = await this.fetchChangelog(learningObjectId);
      // If it does not exist, create a new document in the changelogs collection
      if(!record)
        return this.insertChangelog(learningObjectId, userId, changelogText);
      // Otherwise, append a new log object to the existing array of objects
      return this.editChangelog(record._id, learningObjectId, userId, changelogText);
    } catch (e) {
      console.error(e);
    }
  }

  private async fetchChangelog(learningObjectId: String) {
    try {
      const record = await this.db 
        .collection('changelogs')
        .findOne({learningObjectId: learningObjectId});
      return record;
    } catch (e) {
      console.error(e);
    }
  }

  private async insertChangelog(
    learningObjectId: String,
    userId: String,
    changelogText: String
  ): Promise<void> {
    try { 
      const id = new ObjectId();
      const _id   = id.toHexString();
      const date  = id.getTimestamp();
      await this.db
        .collection('changelogs')
        .insertOne({
          _id: _id,
          learningObjectId: learningObjectId,
          logs: [
            {
              userId: userId,
              date: date,
              text: changelogText
            }
          ]
        });
    } catch (e) {
      console.error(e);
    }
  }

  private async editChangelog(
    id: String,
    learningObjectId: String,
    userId: String,
    changelogText: String
  ): Promise<void> {
    try {
      await this.db
        .collection('changelogs')
        .findOneAndUpdate(
          { learningObjectId: learningObjectId },
          { $push: {
            logs: {
              userId: userId,
              date: new ObjectId().getTimestamp(),
              text: changelogText
            }
          }}
        )
    } catch (e) {
      console.log(e);
    }
  }
}
