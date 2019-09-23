import * as request from 'request-promise';
import { User } from '../../shared/entity';
import { USER_ROUTES } from '../shared/routes';
import { generateServiceToken } from '../../drivers/TokenManager';
import { UserGateway } from '../interfaces/UserGateway';

export class UserServiceGateway implements UserGateway {
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
}
