import * as Redis from 'ioredis';
import { InMemoryStore } from '../interfaces/InMemoryStore';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 6379;
export class IORedisDriver implements InMemoryStore {
  private store: Redis.Redis;
  constructor(host?: string, port?: number) {
    this.store = new Redis({
      host: host ? host : DEFAULT_HOST,
      port: port ? port : DEFAULT_PORT,
    });
    this.store.on('error', (e: any) => {
      console.error(`[REDIS ERROR]: ${e}`);
    });
  }

  /**
   * Gets value at key in Redis Store
   *
   * @param {{ key: string }} params
   * @returns {Promise<any>}
   * @memberof IORedisDriver
   */
  async get(params: { key: string }): Promise<any> {
    try {
      const value = await this.store.get(params.key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Sets key-value pair in Redis Store
   *
   * @param {{
   *     key: string;
   *     value: any;
   *     expiration?: number;
   *   }} params
   * @returns {Promise<void>}
   * @memberof IORedisDriver
   */
  async set(params: {
    key: string;
    value: any;
    expiration?: number;
  }): Promise<void> {
    try {
      await this.store.set(params.key, JSON.stringify(params.value));
      if (params.expiration) {
        this.store.expire(params.key, params.expiration);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Removes key-value pair in Redis Store
   *
   * @param {{ key: string }} params
   * @returns {Promise<void>}
   * @memberof IORedisDriver
   */
  async remove(params: { key: string }): Promise<void> {
    try {
      await this.store.del(params.key);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
