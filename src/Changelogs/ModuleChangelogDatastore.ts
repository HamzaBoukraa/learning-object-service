import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { ChangeLogDocument } from '../shared/types/changelog';
import { ChangelogDataStore } from './interfaces/ChangelogDataStore';

export class ModuleChangelogDataStore implements ChangelogDataStore {
  constructor(private db: Db) { }

  /**
   * Upsert document in changelog collection
   *
   * @param {string} cuid The cuid of the specified learning object
   * @param {string} userId The id of the changelog author
   * @param {string} changelogText The contents of the incoming changelog
   *
   * @returns {void}
   */
  async createChangelog(params: {
    cuid: string,
    author: {
      userId: string,
      name: string,
      role: string,
      profileImage: string,
    },
    changelogText: string,
  }): Promise<void> {
    await this.db.collection(COLLECTIONS.CHANGELOG).updateOne(
      { cuid: params.cuid },
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
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument} A single changelog object with only the last element in the logs array
   */
  async getRecentChangelog(params: {
    cuid: string,
  }): Promise<ChangeLogDocument> {
      const changelog = await this.db
        .collection(COLLECTIONS.CHANGELOG)
        .findOne(
          { cuid: params.cuid },
          { projection: { learningObjectId: 1, logs: { $slice: -1 } } },
        );
      return changelog;
  }

  /**
   * Get all changelogs for a specified learning object
   *
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to
   *
   * @returns {ChangeLogDocument[]} All changelogs for a learning object
   */
  fetchAllChangelogs(params: {
    cuid: string,
  }): Promise<ChangeLogDocument[]> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { cuid: params.cuid } },
        { $unwind: '$logs' },
        { $sort: { 'logs.date': -1 } },
        { $group: { _id: '$_id', logs: { $push: '$logs' } } },
      ])
      .toArray();
  }

  /**
   * Get all change logs for the specified Learning Object that were created before the given date
   *
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to
   * @param {string} date The date of that the changelog was created
   */
  fetchChangelogsBeforeDate(params: {
    cuid: string,
    date: string,
  }): Promise<ChangeLogDocument[]> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { cuid: params.cuid } },
        { $unwind: '$logs' },
        { $match: { 'logs.date': { $lt: parseInt(params.date, 10) } } },
        { $sort: { 'logs.date': -1 } },
        { $group: { _id: '$_id', logs: { $push: '$logs' } } },
      ])
      .toArray();
  }

  /**
   * Get all change logs for the specified Learning Object that were created before the given date
   *
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to
   * @param {string} date The date of that the changelog was created
   */
  fetchRecentChangelogBeforeDate(params: {
    cuid: string,
    date: string,
  }): Promise<ChangeLogDocument> {
    return this.db
      .collection(COLLECTIONS.CHANGELOG)
      .aggregate([
        { $match: { cuid: params.cuid } },
        { $unwind: '$logs' },
        { $match: { 'logs.date': { $lt: parseInt(params.date, 10) } } },
        { $sort: { 'logs.date': -1 } },
        { $limit: 1 },
        { $group: { _id: '$_id', logs: { $push: '$logs' } } },
      ])
      .toArray()[0];
  }

  /**
   * Removes an entire document from the changelogs collection. This function is only triggered when its
   * corresponding learning object is deleted. This effectively deletes all log entries for a Learning Object.
   *
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to
   *
   * @returns {void}
   */
  async deleteChangelog(params: {
    cuid: string,
  }): Promise<void> {
    await this.db
      .collection(COLLECTIONS.CHANGELOG)
      .remove({ cuid: params.cuid });
  }

  /**
   * Removes an entire document from the changelogs collection. This function is only triggered when a revision of a learning object
   * is deleted so that all of the changelogs that were left on the revision.
   * @param {string} cuid The cuid of the learning object that the requested changelog belongs to.
   * @param {string} date The date of the last release of the learning object.
   */
  async deleteChangelogsAfterRelease(params: {
    cuid: string,
    date: string,
  }): Promise<void> {
    await this.db
      .collection(COLLECTIONS.CHANGELOG)
      .updateOne({cuid: params.cuid}, {$pull: { logs: {date: {$gt: parseInt(params.date, 10) }}}});
  }
}
