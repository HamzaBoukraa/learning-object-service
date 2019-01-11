import {
  LearningObjectStatDatastore,
  LearningObjectStats,
} from './LearningObjectStatsInteractor';
import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';

const BLOOMS_DISTRIBUTION_COLLECTION = 'blooms_outcome_distribution';

const BLOOMS = {
  APPLY: 'Apply and Analyze',
  EVALUATE: 'Evaluate and Synthesize',
  REMEMBER: 'Remember and Understand',
};

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
    const bloomsData = await this.db
      .collection<{ _id: string; value: number }>(
        BLOOMS_DISTRIBUTION_COLLECTION,
      )
      .find()
      .toArray();
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
      blooms_distribution: {
        apply: 0,
        evaluate: 0,
        remember: 0,
      },
    };

    if (bloomsData && bloomsData.length) {
      for (let i = 0; i < bloomsData.length; i++) {
        switch (bloomsData[i]._id) {
          case BLOOMS.APPLY:
            stats.blooms_distribution.apply = bloomsData[i].value;
            break;
          case BLOOMS.EVALUATE:
            stats.blooms_distribution.evaluate = bloomsData[i].value;
            break;
          case BLOOMS.REMEMBER:
            stats.blooms_distribution.remember = bloomsData[i].value;
            break;
          default:
        }
      }
    } else {
      console.log('BLOOMS_DATA is undefined. ');
    }

    if (statsArr && statsArr.length) {
      statsArr.map(stat => {
        stats.ids.push(...stat.ids);
        stats.lengths[stat._id] = stat.count;
      });
    }

    return stats;
  }
}
