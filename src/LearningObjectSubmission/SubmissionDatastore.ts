import { User, LearningObject } from '@cyber4all/clark-entity';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { Db } from 'mongodb';
import * as ObjectMapper from '../drivers/Mongo/ObjectMapper';
import { UserDocument } from '../types';

const ERROR_MESSAGE = {
  INVALID_ACCESS: `Invalid access. User must be verified to publish Learning Objects`,
  RESTRICTED: `Unable to publish. Learning Object locked by reviewer.`,
};

export class SubmissionDatastore {
  constructor(private db: Db) {}

  public async submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void> {
    try {
      const user = await this.fetchUser(username);

      // check if user is verified and if user is attempting to publish. If not verified and attempting to publish reject
      if (!user.emailVerified) {
        return Promise.reject(ERROR_MESSAGE.INVALID_ACCESS);
      }

      // else
      const object: { lock: LearningObject.Lock } = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne({ _id: id }, { projection: { _id: 0, lock: 1 } });

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

  public async unsubmitLearningObject(id: string): Promise<void> {
    await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).findOneAndUpdate(
      { _id: id },
      {
        $set: {
          published: false,
          status: 'unreleased',
        },
      },
    );
  }

  private objectHasRestrictions(lock: LearningObject.Lock) {
    return (
      lock &&
      (lock.restrictions.indexOf(LearningObject.Restriction.FULL) > -1 ||
        lock.restrictions.indexOf(LearningObject.Restriction.PUBLISH) > -1)
    );
  }

  // TODO: Should this be an external helper?
  async fetchUser(username: string): Promise<User> {
    const doc = await this.fetchUserDocument(username);
    const user = ObjectMapper.generateUser(doc);
    return user;
  }

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

  public async createChangelog (
    learningObjectId: string,
    userId: string,
    changelogText: string
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

  private async fetchChangelog(learningObjectId: string) {
    try {
      const record = await this.db 
        .collection(COLLECTIONS.ChangelogCollection.name)
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
        .collection(COLLECTIONS.ChangelogCollection.name)
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
        .collection(COLLECTIONS.ChangelogCollection.name)
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
