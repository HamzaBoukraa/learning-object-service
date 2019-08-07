export { LearningObject, HierarchicalLearningObject } from '../../../../shared/entity';
import { UserToken } from '../../../../shared/types/user-token';
import { Writable, Readable } from 'stream';

/**
 * Source for all types used within this module
 */
export { UserToken, Writable, Readable };

export interface BundleData {
  prefix?: string;
  name: string;
  data: Readable;
}

export enum BundleExtension {
  Zip = 'zip',
}
