import { Readable } from 'stream';

export abstract class CCLicenseRetriever {
  /**
   * Returns a readable stream of the latest creative commons license
   *
   * @abstract
   * @returns {Promise<Readable>}
   * @memberof CCLicenseRetriever
   */
  abstract getLatestLicense(): Promise<Readable>;
}
