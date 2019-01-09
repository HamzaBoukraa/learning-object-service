import { LibraryCommunicator } from '../interfaces/interfaces';

export interface LearningObjectStats {
  ids: string[];
  downloads: number;
  saves: number;
  lengths: {
    nanomodule: number;
    micromodule: number;
    module: number;
    unit: number;
    course: number;
  }
  blooms_distribution: {
    apply: number; 
    evaluate: number; 
    remember: number; 
  };
}
export interface LearningObjectStatDatastore {
  fetchStats(params: { query: any }): Promise<Partial<LearningObjectStats>>;
}

export async function getStats(params: {
  dataStore: LearningObjectStatDatastore;
  library: LibraryCommunicator;
  query: any;
}): Promise<LearningObjectStats> {
  const stats = await params.dataStore.fetchStats({ query: params.query });
  stats.downloads = 0;
  stats.saves = 0;
  await Promise.all(
    stats.ids.map(async id => {
      const metrics = await params.library.getMetrics(id);
      stats.downloads += metrics.downloads;
      stats.saves += metrics.saves;
      
    }),
    
  );
  delete stats.ids;
  return stats as LearningObjectStats;
}
