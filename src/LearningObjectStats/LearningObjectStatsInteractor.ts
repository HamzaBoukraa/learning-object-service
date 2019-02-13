export interface LearningObjectStats {
  downloads: number;
  saves: number;
  working: number;
  total: number;
  released: number;
  lengths: {
    nanomodule: number;
    micromodule: number;
    module: number;
    unit: number;
    course: number;
  };
  blooms_distribution: {
    apply: number;
    evaluate: number;
    remember: number;
  };
}
export interface LearningObjectStatDatastore {
  fetchStats(params: { query: any }): Promise<LearningObjectStats>;
}

export async function getStats(params: {
  dataStore: LearningObjectStatDatastore;
  query: any;
}): Promise<LearningObjectStats> {
  return params.dataStore.fetchStats({ query: params.query });
}
