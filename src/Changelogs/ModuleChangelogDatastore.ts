import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { reportError } from '../shared/SentryConnector';
import { ResourceError, ResourceErrorReason, ServiceError, ServiceErrorReason } from '../shared/errors';
import { ChangeLogDocument } from '../shared/types/changelog';
import { ChangelogDataStore } from './interfaces/ChangelogDataStore';

export class ModuleChangelogDataStore implements ChangelogDataStore {
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
  async createChangelog(params: {
    learningObjectId: string,
    author: {
      userId: string,
      name: string,
      role: string,
      profileImage: string,
    },
    changelogText: string,
  }): Promise<void> {
    await this.db.collection(COLLECTIONS.CHANGELOG).updateOne(
      { learningObjectId: params.learningObjectId },
      {
        $push: {
          logs: {
            author: params.author,
            date: Date.now(),
            text: params.changelogText,
          },
        },
      },
      {
        upsert: true,
      },
    );
  }

  /**
   * Get a changelog object with the last element in the logs array
   * The last element in the logs array is the most recent changelog
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument} A single changelog object with only the last element in the logs array
   */
  async getRecentChangelog(params: {
    learningObjectId: string,
  }): Promise<ChangeLogDocument> {
      const changelog = await this.db
        .collection(COLLECTIONS.CHANGELOG)
        .findOne(
          { learningObjectId: params.learningObjectId },
          { projection: { learningObjectId: 1, logs: { $slice: -1 } } },
        );
      return changelog;
  }

  /**
   * Get all changelogs for a specified learning object
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument[]} All changelogs for a learning object
   */
  fetchAllChangelogs(params: {
    learningObjectId: string,
  }): Promise<ChangeLogDocument[]> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { learningObjectId: params.learningObjectId } },
        { $unwind: '$logs' },
        { $sort: { 'logs.date': -1 } },
        { $group: { _id: '$learningObjectId', logs: { $push: '$logs' } } },
      ])
      .toArray();
  }

  /**
   * Get all change logs for the specified Learning Object that were created before the given date
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   * @param {string} date The date of that the changelog was created
   */
  fetchChangelogsBeforeDate(params: {
    learningObjectId: string,
    date: string,
  }): Promise<ChangeLogDocument[]> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { learningObjectId: params.learningObjectId } },
        { $unwind: '$logs' },
        { $match: { 'logs.date': { $lt: parseInt(params.date, 10) } } },
        { $sort: { 'logs.date': -1 } },
        { $group: { _id: '$learningObjectId', logs: { $push: '$logs' } } },
      ])
      .toArray();
  }

  /**
   * Get all change logs for the specified Learning Object that were created before the given date
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   * @param {string} date The date of that the changelog was created
   */
  fetchRecentChangelogBeforeDate(params: {
    learningObjectId: string,
    date: string,
  }): Promise<ChangeLogDocument> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { learningObjectId: params.learningObjectId } },
        { $unwind: '$logs' },
        { $match: { 'logs.date': { $lt: parseInt(params.date, 10) } } },
        { $sort: { 'logs.date': -1 } },
        { $limit: 1 },
        { $group: { _id: '$learningObjectId', logs: { $push: '$logs' } } },
      ])
      .toArray()[0];
  }

  /**
   * Removes an entire document from the changelogs collection. This function is only triggered when its
   * corresponding learning object is deleted.
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   *
   * @returns {void}
   */
  async deleteChangelog(params: {
    learningObjectId: string,
  }): Promise<void> {
    await this.db
      .collection(COLLECTIONS.CHANGELOG)
      .remove({ learningObjectId: params.learningObjectId });
  }
}
