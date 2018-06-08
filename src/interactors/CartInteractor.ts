import * as request from 'request-promise';
import { CART_ROUTES } from '../routes';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';

export class CartInteractor {
  private static options = {
    uri: '',
    json: true,
  };
  public static async getMetrics(objectID: string): Promise<Metrics> {
    try {
      this.options.uri = CART_ROUTES.METRICS(objectID);
      return request(this.options);
    } catch (e) {
      return Promise.reject(`Problem fetching metrics. Error: ${e}`);
    }
  }
}
