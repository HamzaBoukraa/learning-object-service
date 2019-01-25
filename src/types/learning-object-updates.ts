import { LearningObject } from '@cyber4all/clark-entity';

export interface LearningObjectUpdates {
  name?: string;
  date?: string;
  length?: string;
  levels?: string[];
  description?: string;
  contributors?: string[];
  status?: string;
  published?: boolean;
  materials?: { [index: string]: any };
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
  'materials.pdf': null,
  'materials.notes': '',
  'materials.urls': [],
  'materials.folderDescriptions': [],
};
export const VALID_LEARNING_OBJECT_UPDATES = Object.keys(
  LearningObjectUpdateProps,
);
