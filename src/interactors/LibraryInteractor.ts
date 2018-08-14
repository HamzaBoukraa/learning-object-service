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
      this.options.uri = LIBRARY_ROUTES.METRICS(objectID);
      this.options.headers.Authorization = `Bearer ${generateServiceToken()}`;
      return request(this.options);
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
    this.options.uri = LIBRARY_ROUTES.CLEAN(ids);
    this.options.method = 'PATCH';
    this.options.headers.Authorization = `Bearer ${generateServiceToken()}`;
    return request(this.options);
  }
}
