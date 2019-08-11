import { USER_ROUTES } from './routes';
import { generateServiceToken } from '../../../drivers/TokenManager';
import * as request from 'request-promise';
import { User } from '../../entity';
import { isEmail } from '../../functions';

export class UserServiceGateway {
  private options = {
    uri: '',
    json: true,
    headers: {
      Authorization: 'Bearer',
    },
    method: 'GET',
  };

  /**
   * @inheritdoc
   * @param {string} username username of the user to retrieve
   */
  async getUser(username: string): Promise<User> {
    const options = { ...this.options };
    options.uri = USER_ROUTES.GET_USER(username);
    options.headers.Authorization = `Bearer ${generateServiceToken()}`;
    const res = await request(options);
    return new User(res);
  }


  /**
   * Fetch the user document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {UserRecord}
   */
  async queryUserById(id: string): Promise<User> {
    try {
      const doc = await this.db
        .collection<UserDocument>(COLLECTIONS.USERS)
        .findOne({ _id: id });
      const user = ObjectMapper.generateUser(doc);
      return user;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Look up a user by its login id.
   *
   * @deprecated This function is no longer supported, please use `findUserId` instead.
   *
   * @async
   *
   * @param {string} id the user's login id
   *
   * @returns {UserID}
   */
  async findUser(username: string): Promise<string> {
    try {
      const query = {};
      if (isEmail(username)) {
        query['email'] = username;
      } else {
        query['username'] = username;
      }
      const userRecord = await this.db
        .collection(COLLECTIONS.USERS)
        .findOne<UserDocument>(query, { projection: { _id: 1 } });
      if (!userRecord)
        return Promise.reject(
          new ResourceError(
            `Cannot find user with username ${username}`,
            ResourceErrorReason.NOT_FOUND,
          ),
        );
      return `${userRecord._id}`;
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
  }


  /**
   * @inheritdoc
   * @async
   *
   * @param {string} userIdentifier the user's username or email
   *
   * @returns {UserID}
   */
  async findUserId(userIdentifier: string): Promise<string> {
    const query = {};
    if (isEmail(userIdentifier)) {
      query['email'] = userIdentifier;
    } else {
      query['username'] = userIdentifier;
    }
    const userRecord = await this.db
      .collection(COLLECTIONS.USERS)
      .findOne<UserDocument>(query, { projection: { _id: 1 } });
    if (userRecord) {
      return `${userRecord._id}`;
    }
    return null;
  }
}
