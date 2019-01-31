import * as request from 'request-promise';
import { LibraryCommunicator } from '../interfaces/LibraryCommunicator';
import { LIBRARY_ROUTES } from '../routes';
import { generateServiceToken } from './TokenManager';
import { LearningObject } from '@cyber4all/clark-entity';

export class LibraryDriver implements LibraryCommunicator {
  private options = {
    uri: '',
    json: true,
    headers: {
      Authorization: 'Bearer',
    },
    method: 'GET',
  };

  public async getMetrics(objectID: string): Promise<LearningObject.Metrics> {
    try {
      const options = { ...this.options };
      options.uri = LIBRARY_ROUTES.METRICS(objectID);
      options.headers.Authorization = `Bearer ${generateServiceToken()}`;
      return request(options);
    } catch (e) {
      return Promise.reject(`Problem fetching metrics. Error: ${e}`);
    }
  }

  /**
   * Removes learning object ids from all carts that reference them
   * @param ids Array of string ids
   */
  public async cleanObjectsFromLibraries(ids: Array<string>): Promise<void> {
    const options = { ...this.options };
    options.uri = LIBRARY_ROUTES.CLEAN(ids);
    options.method = 'PATCH';
    options.headers.Authorization = `Bearer ${generateServiceToken()}`;
    return request(options);
  }
}
