import {
  LearningObjectStatDatastore,
  LearningObjectStats,
} from './LearningObjectStatsInteractor';
import { Db } from 'mongodb';
import { COLLECTIONS } from '../drivers/MongoDriver';

const ONION_BLOOMS= 'blooms_outcome_distribution'
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
      const bloomsData = await this.db.collection<{_id:string, value:number}>(ONION_BLOOMS).find().toArray()
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
      }
    };
    for(var i=0; i<bloomsData.length; i++){
      if(bloomsData[i]._id === 'Apply and Analyze'){
        stats.blooms_distribution.apply = bloomsData[i].value; 
      }
      if(bloomsData[i]._id === 'Evaluate and Synthesiz'){
        stats.blooms_distribution.evaluate = bloomsData[i].value; 
      }
      if(bloomsData[i]._id === 'Remember and Understand'){
        stats.blooms_distribution.remember = bloomsData[i].value; 
      }
      
      
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
