export interface FileMeta {
  name: string;
  fileType: string;
  url: string;
  size: number;
  fullPath?: string;
}

export type LearningObjectFilter = 'released' | 'unreleased';
export type MaterialsFilter = 'released' | 'unreleased';
