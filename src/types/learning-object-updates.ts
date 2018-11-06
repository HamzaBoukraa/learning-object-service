import {
  LearningObjectPDF,
  FolderDescription,
} from '@cyber4all/clark-entity/dist/learning-object';

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
  'materials.pdf'?: LearningObjectPDF;
  'materials.folderDescriptions'?: FolderDescription[];
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
  materials: {},
};
export const VALID_LEARNING_OBJECT_UPDATES = Object.keys(
  LearningObjectUpdateProps,
);
