import {
  LearningObjectStatDatastore,
  LearningObjectStats,
} from './LearningObjectStatsInteractor';
import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { LearningObject } from '../entity';

const USAGE_STATS_COLLECTION = 'usage-stats';
const BLOOMS_DISTRIBUTION_COLLECTION = 'blooms_outcome_distribution';

const BLOOMS = {
  APPLY: 'Apply and Analyze',
  EVALUATE: 'Evaluate and Synthesize',
  REMEMBER: 'Remember and Understand',
};

export class LearningObjectStatStore implements LearningObjectStatDatastore {
  constructor(private db: Db) {}

  /**
   * Aggregates stats for all learning objects into an object with total downloads, saves, released, length distribution, and bloom distribution
   *
   * @param {{ query: any }} params
   * @returns {Promise<LearningObjectStats>}
   * @memberof LearningObjectStatStore
   */
  async fetchStats(params: { query: any }): Promise<LearningObjectStats> {
    const releasedCount$ = this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .count();

    // Perform aggregation on Learning Objects collection to get length distribution, total number of objects, and number of released objects
    const statCursor = this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate<{
        _id: string;
        ids: string[];
        count: number;
        waiting: number;
        peerReview: number;
        proofing: number;
      }>([
        { $match: params.query },
        {
          $group: {
            _id: '$length',
            count: { $sum: 1 },
            waiting: {
              $sum: {
                $cond: [
                  { $eq: ['$status', LearningObject.Status.WAITING] },
                  1,
                  0,
                ],
              },
            },
            peerReview: {
              $sum: {
                $cond: [
                  { $eq: ['$status', LearningObject.Status.REVIEW] },
                  1,
                  0,
                ],
              },
            },
            proofing: {
              $sum: {
                $cond: [
                  { $eq: ['$status', LearningObject.Status.PROOFING] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);
    // Fetch blooms distribution data
    const downloadSaves = this.db
      .collection<{ downloads: number; saves: number }>(USAGE_STATS_COLLECTION)
      .findOne({ _id: 'learning-object-stats' });

    // Fetch blooms distribution data
    const bloomsCursor = await this.db
      .collection<{ _id: string; value: number }>(
        BLOOMS_DISTRIBUTION_COLLECTION,
      )
      .find();

    const collectionCount = await this.db
      .collection(COLLECTIONS.LO_COLLECTIONS)
      .count();

    // Convert cursors to arrays
    const [
      releasedCount,
      objectStats,
      bloomsData,
      downloadSavesData,
    ] = await Promise.all([
      releasedCount$,
      statCursor.toArray(),
      bloomsCursor.toArray(),
      downloadSaves,
    ]);

    // Create stats object with default values
    const stats: LearningObjectStats = {
      lengths: {
        nanomodule: 0,
        micromodule: 0,
        module: 0,
        unit: 0,
        course: 0,
      },
      blooms_distribution: {
        apply: 0,
        evaluate: 0,
        remember: 0,
      },
      status: {
        waiting: 0,
        peerReview: 0,
        proofing: 0,
      },
      collections: {
        number: 0,
      },
      total: 0,
      released: releasedCount,
      review: 0,
      downloads: 0,
      saves: 0,
    };

    stats.collections.number = collectionCount;
    // If objectStats is defined and is iterable
    if (objectStats && objectStats.length) {
      // For each stats grouped by length
      objectStats.forEach(stat => {
        // Set stat.lengths[nanomodule | micromodule | module | unit | course] equal to count from aggregation
        stats.lengths[stat._id] = stat.count;
        // Increment total by number in count
        stats.total += stat.count;
        // Increment status by according status
        stats.status.waiting += stat.waiting;
        stats.status.peerReview += stat.peerReview;
        stats.status.proofing += stat.proofing;
      });
      // Set review property to statuses in review stage
      stats.review =
        stats.status.waiting + stats.status.peerReview + stats.status.proofing;
    }
    // If downloadSavesData update stats
    if (downloadSavesData) {
      stats.downloads = downloadSavesData.downloads;
      stats.saves = downloadSavesData.saves;
    }
    // If bloomsData is defined and is iterable
    if (bloomsData && bloomsData.length) {
      // For each bloom level match _id to level in stats object and set appropriate stat.blooms_distribution value to that of the document value
      bloomsData.forEach(bloom => {
        switch (bloom._id) {
          case BLOOMS.APPLY:
            stats.blooms_distribution.apply = bloom.value;
            break;
          case BLOOMS.EVALUATE:
            stats.blooms_distribution.evaluate = bloom.value;
            break;
          case BLOOMS.REMEMBER:
            stats.blooms_distribution.remember = bloom.value;
            break;
          default:
        }
      });
    }

    return stats;
  }
}
