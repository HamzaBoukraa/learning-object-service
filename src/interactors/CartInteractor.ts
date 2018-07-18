import * as request from 'request-promise';
import { CART_ROUTES } from '../routes';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { generateServiceToken } from '../drivers/TokenManager';

export class CartInteractor {
  private static options = {
    uri: '',
    json: true,
    headers: {
      Authorization: 'Bearer',
    },
  };
  public static async getMetrics(objectID: string): Promise<Metrics> {
    try {
      this.options.uri = CART_ROUTES.METRICS(objectID);
      this.options.headers.Authorization = `Bearer ${generateServiceToken()}`;
      return request(this.options);
    } catch (e) {
      return Promise.reject(`Problem fetching metrics. Error: ${e}`);
    }
  }
}
