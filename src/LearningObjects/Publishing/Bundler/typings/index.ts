import { LearningObject } from '../../../../shared/entity';
import { UserToken } from '../../../../shared/types/user-token';
import { Writable, Readable } from 'stream';
import { Response as ExpressResponse } from 'express';

/**
 * Source for all types used within this module
 */
export { LearningObject, UserToken, Writable, Readable, ExpressResponse };

export interface BundleData {
  prefix?: string;
  name: string;
  uri: string;
}

export enum BundleExtension {
  Zip = 'zip',
}
