import {  UTILITY_SERVICE_ROUTES } from '../shared/routes';
import * as request from 'request-promise';
import { generateServiceToken } from './TokenManager';
import { UtilityUser } from '../shared/types/utility-users';
import { reportError } from '../shared/SentryConnector';
import { ResourceError, ResourceErrorReason, ServiceError, ServiceErrorReason} from '../shared/errors';

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

    public async getUtilityUsers(): Promise<UtilityUser[]> {
      try {
        const options = { ...this.options };
        options.uri = UTILITY_SERVICE_ROUTES.USERS();
        return request(options);
      } catch (e) {
        throw new ResourceError(`${e}`, ResourceErrorReason.BAD_REQUEST);
      }
    }
  }
