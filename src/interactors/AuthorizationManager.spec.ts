import { UserToken } from '../types';
import { hasLearningObjectWriteAccess } from './AuthorizationManager';
import { MongoDriver } from '../drivers/drivers';

jest.mock('../drivers/MongoDriver');

describe('#hasLearningObjectWriteAccess', () => {
  let user: UserToken = {
    username: '',
    name: '',
    email: '',
    organization: '',
    emailVerified: '',
    accessGroups: [],
  };
  let dataStore = new MongoDriver('somefakeuri');
  it('should return true for a user with an accessGroup of admin', () => {
    user.accessGroups.push('admin');
    hasLearningObjectWriteAccess(user, 'nccp', dataStore, 'someid');
  });
  it('should return true for a user with an accessGroup of editor', () => {
    user.accessGroups.push('editor');
    hasLearningObjectWriteAccess(user, 'nccp', dataStore, 'someid');
  });
  it('should return true for a user with an accessGroup of lead at a collection', () => {
    const collection = 'collectionName';
    user.accessGroups.push(`lead@${collection}`);
    hasLearningObjectWriteAccess(user, collection, dataStore, 'someid');
  });
  it('should return true for a user with an accessGroup of curator at a collection', () => {
    const collection = 'collectionName';
    user.accessGroups.push(`curator@${collection}`);
    hasLearningObjectWriteAccess(user, collection, dataStore, 'someid');
  });
});
