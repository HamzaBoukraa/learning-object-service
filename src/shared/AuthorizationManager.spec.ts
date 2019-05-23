import { UserToken } from './types';
import { hasLearningObjectWriteAccess } from './AuthorizationManager';

jest.mock('../drivers/MongoDriver');

describe('#hasLearningObjectWriteAccess', () => {
  let user: UserToken = {
    username: '',
    name: '',
    email: '',
    organization: '',
    emailVerified: true,
    accessGroups: [],
  };
  it('should return true for a user with an accessGroup of admin', () => {
    user.accessGroups.push('admin');
    hasLearningObjectWriteAccess(user, null, 'someid');
  });
  it('should return true for a user with an accessGroup of editor', () => {
    user.accessGroups.push('editor');
    hasLearningObjectWriteAccess(user, null, 'someid');
  });
  it('should return true for a user with an accessGroup of lead at a collection', () => {
    const collection = 'collectionName';
    user.accessGroups.push(`lead@${collection}`);
    hasLearningObjectWriteAccess(user, null, 'someid');
  });
  it('should return true for a user with an accessGroup of curator at a collection', () => {
    const collection = 'collectionName';
    user.accessGroups.push(`curator@${collection}`);
    hasLearningObjectWriteAccess(user, null, 'someid');
  });
});
