import { UserDocument } from '../../shared/types';
import { User } from '../../entity';

/**
 * Generates User object from Document
 *
 * @private
 * @param {UserDocument} userRecord
 * @returns {User}
 * @memberof MongoDriver
 */
export function generateUser(userRecord: UserDocument): User {
  const user = new User({
    id: userRecord._id,
    ...(userRecord as Partial<User>),
  });
  user.emailVerified = userRecord.emailVerified
    ? userRecord.emailVerified
    : false;
  return user;
}
