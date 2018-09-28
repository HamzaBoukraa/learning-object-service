import * as request from 'request-promise';
import { LIBRARY_ROUTES } from '../routes';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { generateServiceToken } from '../drivers/TokenManager';

export class LibraryInteractor {
  private static options = {
    uri: '',
    json: true,
    headers: {
      Authorization: 'Bearer',
    },
    method: 'GET',
  };
  public static async getMetrics(objectID: string): Promise<Metrics> {
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
  public static async cleanObjectsFromLibraries(
    ids: Array<string>,
  ): Promise<void> {
    const options = { ...this.options };
    options.uri = LIBRARY_ROUTES.CLEAN(ids);
    options.method = 'PATCH';
    options.headers.Authorization = `Bearer ${generateServiceToken()}`;
    return request(options);
  }
}
