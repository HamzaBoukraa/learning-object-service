import { UserDocument } from '@cyber4all/clark-schema';
import { User } from '@cyber4all/clark-entity';

/**
 * Generates User object from Document
 *
 * @private
 * @param {UserDocument} userRecord
 * @returns {User}
 * @memberof MongoDriver
 */
export function generateUser(userRecord: UserDocument): User {
  const user = new User(
    userRecord.username,
    userRecord.name,
    userRecord.email,
    userRecord.organization,
    null,
  );
  user.emailVerified = userRecord.emailVerified
    ? userRecord.emailVerified
    : false;
  return user;
}
