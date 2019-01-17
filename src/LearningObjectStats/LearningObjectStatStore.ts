import {
  LearningObjectStatDatastore,
  LearningObjectStats,
} from './LearningObjectStatsInteractor';
import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';

const USAGE_STATS_COLLECTION = 'usage-stats';
const BLOOMS_DISTRIBUTION_COLLECTION = 'blooms_outcome_distribution';

const BLOOMS = {
  APPLY: 'Apply and Analyze',
  EVALUATE: 'Evaluate and Synthesize',
  REMEMBER: 'Remember and Understand',
};

export class LearningObjectStatStore implements LearningObjectStatDatastore {
  constructor(private db: Db) {}
  async fetchStats(params: { query: any }): Promise<LearningObjectStats> {
    // Perform aggregation on Learning Objects collection to get length distribution, total number of objects, and number of released objects
    const statCursor = this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate<{
        _id: string;
        ids: string[];
        count: number;
        released: number;
      }>([
        { $match: params.query },
        {
          $group: {
            _id: '$length',
            count: { $sum: 1 },
            released: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'released'] },
                  1,
                  { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
                ],
              },
            },
            ids: { $push: '$_id' },
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

    // Convert cursors to arrays
    const [objectStats, bloomsData, downloadSavesData] = await Promise.all([
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
      total: 0,
      released: 0,
      downloads: 0,
      saves: 0,
    };
    // If objectStats is defined and is iterable
    if (objectStats && objectStats.length) {
      // For each stats grouped by length
      objectStats.forEach(stat => {
        // Set stat.lengths[nanomodule | micromodule | module | unit | course] equal to count from aggregation
        stats.lengths[stat._id] = stat.count;
        // Increment total by number in count
        stats.total += stat.count;
        // Increment released by number in released
        stats.released += stat.released;
      });
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
