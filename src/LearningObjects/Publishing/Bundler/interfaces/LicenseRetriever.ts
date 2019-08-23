import { Readable } from 'stream';

export abstract class LicenseRetriever {
  /**
   * Returns a readable stream of the Learning Object license file
   *
   * @abstract
   * @returns {Promise<Readable>}
   * @memberof LicenseRetriever
   */
  abstract getLicense(): Promise<Readable>;
}
