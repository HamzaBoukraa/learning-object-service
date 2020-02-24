import {  UTILITY_SERVICE_ROUTES } from '../shared/routes';
import * as request from 'request-promise';
import { generateServiceToken } from './TokenManager';

export class UtilityDriver {
    private options = {
      uri: '',
      json: true,
      headers: {
        Authorization: `Bearer ${generateServiceToken()}`,
      },
      method: 'GET',
      body: {},
    };

    public async getUtilityUsers(): Promise<any[]> {
      try {
        const options = { ...this.options };
        options.uri = UTILITY_SERVICE_ROUTES.USERS();
        return request(options);
      } catch (e) {
        return Promise.reject(`Unexpected error has occured while trying to get Utility Users ${e}`);
      }
    }
  }
