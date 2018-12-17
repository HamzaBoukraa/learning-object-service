import {
  LearningObjectStatDatastore,
  LearningObjectStats,
} from './LearningObjectStatsInteractor';
import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';

export class LearningObjectStatStore implements LearningObjectStatDatastore {
  constructor(private db: Db) {}
  async fetchStats(params: {
    query: any;
  }): Promise<Partial<LearningObjectStats>> {
    const statCursor = await this.db
      .collection(COLLECTIONS.LearningObject.name)
      .aggregate([
        { $match: params.query },
        {
          $group: {
            _id: '$length',
            count: { $sum: 1 },
            ids: { $push: '$_id' },
          },
        },
      ]);
    const statsArr: {
      _id: string;
      ids: string[];
      count: number;
    }[] = await statCursor.toArray();
    const stats: Partial<LearningObjectStats> = {
      ids: [],
      lengths: {
        nanomodule: 0,
        micromodule: 0,
        module: 0,
        unit: 0,
        course: 0,
      },
    };
    if (statsArr && statsArr.length) {
      statsArr.map(stat => {
        stats.ids.push(...stat.ids);
        stats.lengths[stat._id] = stat.count;
      });
    }

    return stats;
  }
}
