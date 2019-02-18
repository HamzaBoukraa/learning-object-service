import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { reportError } from '../drivers/SentryConnector';
import { ResourceError, ResourceErrorReason, ServiceError, ServiceErrorReason } from '../errors';
import { ChangeLogDocument } from '../types/Changelog';

export class ChangelogDataStore {
  constructor(private db: Db) { }

  /**
   * Upsert document in changelog collection
   *
   * @param {string} learningObjectId The id of the specified learning object
   * @param {string} userId The id of the changelog author
   * @param {string} changelogText The contents of the incoming changelog
   *
   * @returns {void}
   */
  public async createChangelog(
    learningObjectId: string,
    userId: string,
    changelogText: string,
  ): Promise<void> {
    try {
      await this.db.collection(COLLECTIONS.CHANGLOG).update(
        { learningObjectId },
        {
          $push: {
            logs: {
              userId: userId,
              date: Date.now(),
              text: changelogText,
            },
          },
        },
        {
          upsert: true,
        },
      );
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
  }

  /**
   * Get a changelog object with the last element in the logs array
   * The last element in the logs array is the most recent changelog
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument} A single changelog object with only the last element in the logs array
   */
  async getRecentChangelog(learningObjectId: string): Promise<ChangeLogDocument> {
    try {
      const changelog = await this.db
        .collection(COLLECTIONS.CHANGLOG)
        .findOne(
          { learningObjectId },
          { projection: { learningObjectId: 1, logs: { $slice: -1 } } },
        );
      if (changelog === null) {
        return Promise.reject(new ResourceError('Changelog not found.', ResourceErrorReason.NOT_FOUND));
      }
      return changelog;
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
  }

  /**
   * Removes an entire document from the changelogs collection. This function is only triggered when its
   * corresponding learning object is deleted.
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {void}
   */
  async deleteChangelog(learningObjectId: string): Promise<void> {
    try {
      await this.db
        .collection(COLLECTIONS.CHANGLOG)
        .remove({ learningObjectId: learningObjectId });
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
  }
}
