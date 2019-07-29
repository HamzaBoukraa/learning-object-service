import * as request from 'request-promise';
import { User } from '../../../shared/entity';
import { USER_ROUTES } from './Routes';
import { UserGateway } from '../../interfaces/UserGateway';

export class ModuleUserGateway implements UserGateway {
    private options = {
        uri: '',
        json: true,
        method: 'GET',
    };

  /**
   * @inheritdoc
   * @param {string} username username of the user to retrieve
   */
  async getUser(username: string): Promise<User> {
    const options = { ...this.options };
    options.uri = USER_ROUTES.GET_USER(username);
    const res = await request(options);
    return new User(res);
  }
}