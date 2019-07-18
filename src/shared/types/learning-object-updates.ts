import { LearningObject } from '../entity';

export interface LearningObjectUpdates {
  name?: string;
  date?: string;
  length?: string;
  levels?: string[];
  description?: string;
  contributors?: string[];
  status?: string;
  published?: boolean;
  collection?: string;
  materials?: { [index: string]: any };
  revision?: number;
  'materials.pdf'?: LearningObject.Material.PDF;
  'materials.notes'?: string;
  'materials.urls'?: LearningObject.Material.Url[];
  'materials.folderDescriptions'?: LearningObject.Material.FolderDescription[];
}
const LearningObjectUpdateProps: LearningObjectUpdates = {
  name: '',
  date: '',
  length: '',
  levels: [],
  description: '',
  contributors: [],
  status: '',
  published: false,
  collection: '',
  revision: 0,
  'materials.pdf': null,
  'materials.notes': '',
  'materials.urls': [],
  'materials.folderDescriptions': [],
};
export const VALID_LEARNING_OBJECT_UPDATES = Object.keys(
  LearningObjectUpdateProps,
);
