import * as request from 'request-promise';
import { LibraryCommunicator } from '../shared/interfaces/LibraryCommunicator';
import { LIBRARY_ROUTES } from '../shared/routes';
import { generateServiceToken } from './TokenManager';
import { LearningObject } from '../shared/entity';
import { generateToken } from '../tests/mock-token-manager';
import { UserToken } from '../shared/types';

export class LibraryDriver implements LibraryCommunicator {
  private options = {
    uri: '',
    json: true,
    headers: {
      Authorization: `Bearer ${generateServiceToken()}`,
    },
    method: 'GET',
    body: {},
  };

  public async getMetrics(objectID: string): Promise<LearningObject.Metrics> {
    try {
      const options = { ...this.options };
      options.uri = LIBRARY_ROUTES.METRICS(objectID);
      return request(options);
    } catch (e) {
      return Promise.reject(`Problem fetching metrics. Error: ${e}`);
    }
  }

  public async updateObjectInLibraries(cuid: string, version: number, authorUsername: string, requester: UserToken) {
    const options = { ...this.options };
    options.uri = LIBRARY_ROUTES.UPDATE_OBJECTS(cuid);
    options.headers.Authorization = `Bearer ${generateToken(requester)}`;
    options.method = 'PATCH';
    options.body = { cuid, version, authorUsername };
    return request(options);
  }
}
